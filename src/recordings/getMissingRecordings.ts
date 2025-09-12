import { ValidConversation } from '../analytics/getValidConversations';
import { Recording } from '../genesys/recording.types';

export function conversationsMissingRecordings(
  conversations: ValidConversation[],
  recordings: Recording[]
): ValidConversation[] {
  // Build lookup of (conversationId, sessionId) pairs that DO have recordings
  const haveRecording = new Set(
    recordings
      .filter(r => r.conversationId && r.sessionId)
      .map(r => `${r.conversationId}::${r.sessionId}`)
  );

  // Keep conversations whose (conversationId, peerId) pair is NOT in the set
  return conversations.filter(c => {
    const convId = c.conversationId?.trim();
    const peerId = c.session?.peerId?.trim();

    // If either is missing, treat as "missing recording"
    if (!convId || !peerId) {
      return true;
    }
    return !haveRecording.has(`${convId}::${peerId}`);
  });
}
