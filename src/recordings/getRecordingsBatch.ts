import type platformClient from 'purecloud-platform-client-v2';
import { sleep } from './downloadRecordings';

export async function getRecordingBatch(
  recordingApi: platformClient.RecordingApi,
  chunk: platformClient.Models.BatchDownloadRequest[]
): Promise<platformClient.Models.BatchDownloadJobSubmissionResult | undefined> {
  let retryCount = 0;
  while (retryCount < 5) {
    retryCount++;
    try {
      const batchJob = await recordingApi.postRecordingBatchrequests({
        batchDownloadRequestList: chunk,
      });
      return batchJob;
    } catch (error) {
      //might be connection break or something, just retry
      console.log(
        `Error on postRecordingBatchrequests ${(error as Error).message}...Retry after 5000ms`
      );
      await sleep(5000);
    }
  }
  return undefined;
}
