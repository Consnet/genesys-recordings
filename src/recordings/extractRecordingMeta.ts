import type platformClient from 'purecloud-platform-client-v2';
import { ExtractParams } from '../analytics/extractInteractions';
import { ValidConversation } from '../analytics/getValidConversations';
import { Recording } from '../genesys/recording.types';
import { toUtcHourWindow } from '../util/time';

export async function extractRecordingMetadata(
  recordingApi: platformClient.RecordingApi,
  conversationIds: string[],
  conversations: ValidConversation[],
  params: ExtractParams
): Promise<Recording[]> {
  const window = toUtcHourWindow({
    day: params.day,
    windowStart: params.windowStart,
    windowEnd: params.windowEnd,
    orgTz: params.orgTz,
  });
  const start = new Date(window.startUtc).getTime();
  const end = new Date(window.endUtc).getTime();
  const result = [] as Recording[];

  for (const id of conversationIds) {
    const recordings = await recordingApi.getConversationRecordingmetadata(id);
    for (const recording of recordings) {
      if (recording.media !== 'audio' || !recording.sessionId || !recording.id) {
        continue;
      }
      const recordingEnd = recording.endTime ? new Date(recording.endTime).getTime() : 0;
      if (recordingEnd >= start && recordingEnd <= end) {
        const conv = conversations.find(
          c =>
            c.conversationId === recording.conversationId &&
            c.session.peerId === recording.sessionId
        );
        if (!conv) {
          //This recording does not belong to a selected agent
          continue;
        }
        const rec: Recording = {
          conversationId: id,
          recordingId: recording.id,
          mediaType: recording.media,
          fileState: recording.fileState,
          archiveDate: recording.archiveDate,
          deleteDate: recording.deleteDate,
          sessionId: recording.sessionId,
          startTime: recording.startTime,
          endTime: recording.endTime,
        };
        result.push(rec);
      }
    }
  }
  return result;
}
