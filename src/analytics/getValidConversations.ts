import { Conversations, Participant, Participants, Session } from '../genesys/analytics.types';
import { toUtcHourWindow } from '../util/time';
import { ExtractParams } from './extractInteractions';

type Sessions = Session[];

interface ValidSession {
  sessionId: string;
  peerId: string;
  wrapup: string;
  direction: string;
  segmentStart: string;
  segmentEnd: string;
}

interface ValidParticipant {
  participantId: string;
  userId: string;
  session: ValidSession;
}

export interface ValidConversation extends ValidParticipant {
  conversationId: string;
  conversationStart: string;
  conversationEnd: string;
}

function validSessions(sessions: Sessions, start: number, end: number): ValidSession[] {
  const validSessions = [] as ValidSession[];
  for (const session of sessions) {
    if (!session.segments || !session.peerId || !session.sessionId) {
      continue;
    }
    let valid = false;
    let segmentStart = '';
    let segmentEnd = '';
    let wrapup = '';
    for (const segment of session.segments) {
      const segTime = segment.segmentEnd ? new Date(segment.segmentEnd).getTime() : 0;
      if (segment.segmentType === 'interact' && segTime >= start && segTime <= end) {
        valid = true;
        segmentStart = segment.segmentStart ?? '';
        segmentEnd = segment.segmentEnd ?? '';
      }
      if (
        segment.wrapUpCode &&
        segment.segmentType === 'wrapup' &&
        segTime >= start &&
        segTime <= end
      ) {
        wrapup = segment.wrapUpCode;
      }
    }
    if (valid) {
      validSessions.push({
        sessionId: session.sessionId,
        peerId: session.peerId,
        wrapup,
        segmentStart,
        segmentEnd,
        direction: session.direction ?? '',
      });
    }
  }
  return validSessions;
}

function validParticipant(participant: Participant, userIds?: string[]): boolean {
  const hasUserFilter = Array.isArray(userIds) && userIds.length > 0;
  if (participant.purpose !== 'agent') {
    return false;
  }
  if (hasUserFilter) {
    if (participant.userId && userIds.includes(participant.userId)) {
      return true;
    } else {
      return false;
    }
  }
  return true;
}

function validParticipants(
  participants: Participants,
  start: number,
  end: number,
  userIds?: string[]
): ValidParticipant[] {
  const validParticipants = [] as ValidParticipant[];
  for (const participant of participants) {
    if (!participant.sessions || !participant.participantId || !participant.userId) {
      continue;
    }
    if (validParticipant(participant, userIds)) {
      const sessions = validSessions(participant.sessions, start, end);
      for (const session of sessions) {
        validParticipants.push({
          participantId: participant.participantId,
          userId: participant.userId,
          session,
        });
      }
    }
  }
  return validParticipants;
}

export function getValidConversations(
  conversations: Conversations,
  params: ExtractParams
): ValidConversation[] {
  const window = toUtcHourWindow({
    day: params.day,
    windowStart: params.windowStart,
    windowEnd: params.windowEnd,
    orgTz: params.orgTz,
  });
  const start = new Date(window.startUtc).getTime();
  const end = new Date(window.endUtc).getTime();

  const result = [] as ValidConversation[];
  for (const item of conversations) {
    if (item.participants) {
      const participants = validParticipants(item.participants, start, end, params.userIds);
      for (const participant of participants) {
        const conv = participant as ValidConversation;
        conv.conversationId = item.conversationId;
        conv.conversationEnd = item.conversationEnd ?? '';
        conv.conversationStart = item.conversationStart ?? '';
        result.push(conv);
      }
    }
  }

  return result;
}
