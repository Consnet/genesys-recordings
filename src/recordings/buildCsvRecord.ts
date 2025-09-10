import type platformClient from 'purecloud-platform-client-v2';
import { ValidConversation } from '../analytics/getValidConversations';
import { Recording } from '../genesys/recording.types';

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

function getDurationMs(start?: string, end?: string): number {
  const startMs = parseTimeMs(start);
  const endMs = parseTimeMs(end);
  const durationMs = startMs !== null && endMs !== null && endMs >= startMs ? endMs - startMs : 0;
  return durationMs;
}

function getFallbackWrapup(
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

export function buildCsvRecord(
  item: platformClient.Models.BatchDownloadRequest,
  recordings: Recording[],
  conversations: ValidConversation[],
  fileName: string,
  filePath: string
): CsvRecord | null {
  const recording = recordings.find(r => r.recordingId === item.recordingId);
  if (!recording) {
    //This should not happen, like ever
    console.log(
      `Recording Not found(csv): Conversation ID: ${item.conversationId} recording: ${item.recordingId}`
    );
    return null;
  }
  const conv = conversations.find(
    c => c.conversationId === recording.conversationId && c.session.peerId === recording.sessionId
  );
  if (!conv) {
    //This should not happen, but probably means peerId on session not matching recording sessionID
    console.log(
      `Not found(csv): Conversation ID: ${item.conversationId} session: ${recording.sessionId} recording: ${item.recordingId}`
    );
    return null;
  }
  const wrapup =
    conv.session.wrapup ?? getFallbackWrapup(conversations, recording.conversationId) ?? '';

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
    agentName: 'unknown',
    teamLeaderName: 'unknown',
    callDirection: conv.session.direction,
    wrapupCode: wrapup,
    wrapupName: 'unknown',
    fileName,
    filePath,
  };
}
