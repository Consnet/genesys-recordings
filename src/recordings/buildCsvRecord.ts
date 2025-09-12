import type platformClient from 'purecloud-platform-client-v2';
import { ValidConversation } from '../analytics/getValidConversations';
import { Recording } from '../genesys/recording.types';
import { getAgentDetail } from '../util/getAgentDetail';
import { getWrapupName } from '../util/getWrapUp';

export interface CsvRecord {
  conversationId: string;
  recordingId: string;
  conversationStart: string;
  conversationEnd: string;
  startTime: string;
  endTime: string;
  mediaType: string;
  durationMs: number | null;
  agentId: string;
  agentName: string;
  teamLeaderName: string;
  callDirection: string;
  wrapupCode: string;
  wrapupName: string;
  fileName: string;
  filePath: string;
}

function parseTimeMs(iso?: string): number | null {
  if (!iso) {
    return null;
  }
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

export function getDurationMs(start?: string, end?: string): number {
  const startMs = parseTimeMs(start);
  const endMs = parseTimeMs(end);
  const durationMs = startMs !== null && endMs !== null && endMs >= startMs ? endMs - startMs : 0;
  return durationMs;
}

export function getFallbackWrapup(
  conversations: ValidConversation[],
  conversationId: string
): string | undefined {
  //try to find wrapup on a different segment
  const fallback = conversations.find(
    c => c.conversationId === conversationId && c.session.wrapup?.trim()
  );
  if (fallback?.session.wrapup.trim()) {
    return fallback?.session.wrapup;
  }
  return undefined;
}

export async function buildCsvRecord(
  item: platformClient.Models.BatchDownloadRequest,
  recordings: Recording[],
  conversations: ValidConversation[],
  fileName: string,
  filePath: string,
  usersApi: platformClient.UsersApi,
  routingApi: platformClient.RoutingApi
): Promise<CsvRecord | null> {
  const recording = recordings.find(r => r.recordingId === item.recordingId);
  if (!recording) {
    //This should not happen, ever
    console.log(
      `Recording Not found(csv): Conversation ID: ${item.conversationId} recording: ${item.recordingId}`
    );
    return null;
  }
  const conv = conversations.find(
    c => c.conversationId === recording.conversationId && c.session.peerId === recording.sessionId
  );
  if (!conv) {
    //This should not happen - It means that the recording is for an agent that is not in our filter criteria
    //peerId does not match a valid session, but check happens before download, so should not be here
    console.log(
      `Not found(csv): Conversation ID: ${item.conversationId} session: ${recording.sessionId} recording: ${item.recordingId}`
    );
    return null;
  }
  const wrapupCode = conv.session.wrapup ?? '';

  const wrapupName = await getWrapupName(wrapupCode, routingApi);
  const agent = await getAgentDetail(conv.userId, usersApi);
  return {
    conversationId: recording.conversationId,
    recordingId: recording.recordingId,
    conversationStart: conv.conversationStart,
    conversationEnd: conv.conversationEnd,
    startTime: recording.startTime ?? '',
    endTime: recording.endTime ?? '',
    mediaType: recording.mediaType ?? '',
    durationMs: getDurationMs(recording.startTime, recording.endTime),
    agentId: conv.userId,
    agentName: agent.name,
    teamLeaderName: agent.managerName,
    callDirection: conv.session.direction,
    wrapupCode: wrapupCode,
    wrapupName: wrapupName,
    fileName,
    filePath,
  };
}
