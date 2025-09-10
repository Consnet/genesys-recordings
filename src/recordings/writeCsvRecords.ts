import { createObjectCsvWriter } from 'csv-writer';
import { CsvRecord } from './buildCsvRecord';

export async function writeCsvRecords(path: string, csvRecords: CsvRecord[]): Promise<void> {
  await createObjectCsvWriter({
    path,
    header: [
      { id: 'conversationId', title: 'Conversation ID' },
      { id: 'recordingId', title: 'Recording ID' },
      { id: 'conversationStart', title: 'Conversation Start' },
      { id: 'conversationEnd', title: 'Conversation End' },
      { id: 'startTime', title: 'Rec Start Time' },
      { id: 'endTime', title: 'Rec End Time' },
      { id: 'mediaType', title: 'Media Type' },
      { id: 'durationMs', title: 'Duration (ms)' },
      { id: 'agentId', title: 'Agent ID' },
      { id: 'agentName', title: 'Agent Name' },
      { id: 'teamLeaderName', title: 'Team Leader Name' },
      { id: 'callDirection', title: 'Call Direction' },
      { id: 'wrapupCode', title: 'Wrapup Code' },
      { id: 'wrapupName', title: 'Wrapup Name' },
      { id: 'fileName', title: 'File Name' },
      { id: 'filePath', title: 'File Path' },
    ],
  }).writeRecords(csvRecords);
}
