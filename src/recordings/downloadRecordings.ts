import path from 'path';
import type platformClient from 'purecloud-platform-client-v2';
import { ExtractParams } from '../analytics/extractInteractions';
import { ValidConversation } from '../analytics/getValidConversations';
import { CONFIG } from '../config/env';
import { GenesysApis } from '../genesys/client';
import { Recording } from '../genesys/recording.types';
import { getHourInterval } from '../util/time';
import { buildCsvRecord, CsvRecord } from './buildCsvRecord';
import { downloadWithRetry } from './downloadWithRetry';
import { getRecordingBatch } from './getRecordingsBatch';
import { writeCsvRecords } from './writeCsvRecords';

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export const sleep = (ms: number): Promise<void> => new Promise<void>(res => setTimeout(res, ms));

function validateItem(
  item: platformClient.Models.BatchDownloadJobResult | undefined,
  reqItem: platformClient.Models.BatchDownloadRequest
): boolean {
  if (!item) {
    console.warn(`Missing result for recordingId: ${reqItem.recordingId}`);
    return false;
  }
  if (item.errorMsg) {
    console.warn(
      `Error for recordingId: ${reqItem.recordingId}, conversationId: ${reqItem.conversationId}, error: ${item.errorMsg}`
    );
    return false;
  }

  if (item.contentType?.includes('screen')) {
    console.log(`Skipping screen recording: ${item.recordingId} (${item.contentType})`);
    return false;
  }

  if (!item.resultUrl) {
    console.warn(`No resultUrl for recordingId: ${item.recordingId}`);
    return false;
  }
  return true;
}

interface ProcessRecordingsOptions {
  apis: GenesysApis;
  recordings: Recording[];
  conversations: ValidConversation[];
  params: ExtractParams;
  chunkSize?: number; // default 100
  pollIntervalMs?: number; // default 5000
  concurrency?: number; // default 35
}

export async function processRecordings({
  apis,
  recordings,
  conversations,
  params,
  chunkSize = CONFIG.BATCH_SIZE,
  pollIntervalMs = CONFIG.RETRY_DELAY_MS,
}: ProcessRecordingsOptions): Promise<{ failed: number; downloaded: number }> {
  let failedDownloads = 0;
  let downloaded = 0;

  const hourInterval = getHourInterval(params);

  const downloadList: Array<platformClient.Models.BatchDownloadRequest> = recordings.map(r => ({
    conversationId: r.conversationId,
    recordingId: r.recordingId,
  }));

  const recordingChunks = chunkArray(downloadList, chunkSize);
  console.log(`Recordings chunks: ${recordingChunks.length}`);
  let chunkNo = 0;
  for (const chunk of recordingChunks) {
    chunkNo++;
    const batchJob = await getRecordingBatch(apis.recording, chunk);

    if (!batchJob?.id) {
      console.error(`No Batchjob ID returned by Genesys for chunk ${chunkNo}`);
      continue;
    }
    while (true) {
      const result = await apis.recording.getRecordingBatchrequest(batchJob.id);
      if (result.resultCount && result.resultCount === result.expectedResultCount) {
        break;
      }
      await sleep(pollIntervalMs);
    }
    const resultInfo = await apis.recording.getRecordingBatchrequest(batchJob.id);
    if (!resultInfo.results) {
      console.error(`No chunks returned for chunk ${chunkNo}`);
      continue;
    }

    const csvRecords: CsvRecord[] = [];
    for (const reqItem of chunk) {
      const item = resultInfo.results.find(r => r.recordingId === reqItem.recordingId);
      const valid = validateItem(item, reqItem);
      if (!valid || !item?.resultUrl) {
        failedDownloads++;
        continue;
      }

      const fileName = `${item.conversationId}_${item.recordingId}.wav`;
      console.log(`Downloading: ${fileName}`);
      const filePath = path.join(params.downloadDir, fileName);
      try {
        await downloadWithRetry(item.resultUrl, filePath);
        downloaded++;
        const record = await buildCsvRecord(
          reqItem,
          recordings,
          conversations,
          fileName,
          filePath,
          apis.users,
          apis.routing
        );
        if (record) {
          csvRecords.push(record);
        }
      } catch (err) {
        console.warn(
          `Download failed for recordingId: ${item.recordingId}, conversationId: ${item.conversationId}. ${(err as Error).message}`
        );
        failedDownloads++;
      }
    }

    const csvPath = path.join(
      params.downloadDir,
      `${params.day}_${hourInterval}_batch${chunkNo}.csv`
    );
    await writeCsvRecords(csvPath, csvRecords);
  }

  //Do a final check. Are there segments where no recordings are available?
  // This check is currently not working correctly
  // const missing = conversationsMissingRecordings(conversations, recordings);
  // const missingCSV: CsvRecord[] = [];
  // for (const item of missing) {
  //   try {
  //     const record = await buildCsvMissing(item, apis.users, apis.routing);
  //     if (record) {
  //       missingCSV.push(record);
  //     }
  //   } catch (error) {
  //     console.warn(
  //       `Can't process missing record conversationId: ${item.conversationId}. ${(error as Error).message}`
  //     );
  //   }
  // }
  // const csvPath = path.join(params.downloadDir, `${params.day}_${hourInterval}_missing.csv`);
  // await writeCsvRecords(csvPath, missingCSV);

  console.log(`Done. Downloaded=${downloaded}, Failed=${failedDownloads}`);
  return { failed: failedDownloads, downloaded };
}
