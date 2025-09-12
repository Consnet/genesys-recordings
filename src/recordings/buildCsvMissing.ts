import type platformClient from 'purecloud-platform-client-v2';
import { ValidConversation } from '../analytics/getValidConversations';
import { getAgentDetail } from '../util/getAgentDetail';
import { getWrapupName } from '../util/getWrapUp';
import { CsvRecord, getDurationMs } from './buildCsvRecord';

export async function buildCsvMissing(
  item: ValidConversation,
  usersApi: platformClient.UsersApi,
  routingApi: platformClient.RoutingApi
): Promise<CsvRecord | null> {
  const wrapupCode = item.session.wrapup ?? '';

  const wrapupName = await getWrapupName(wrapupCode, routingApi);
  const agent = await getAgentDetail(item.userId, usersApi);
  return {
    conversationId: item.conversationId,
    recordingId: item.session.peerId,
    conversationStart: item.conversationStart,
    conversationEnd: item.conversationEnd,
    startTime: item.session.segmentStart ?? '',
    endTime: item.session.segmentEnd ?? '',
    mediaType: 'voice',
    durationMs: getDurationMs(item.session.segmentStart, item.session.segmentEnd),
    agentId: item.userId,
    agentName: agent.name,
    teamLeaderName: agent.managerName,
    callDirection: item.session.direction,
    wrapupCode: wrapupCode,
    wrapupName: wrapupName,
    fileName: 'none',
    filePath: 'none',
  };
}
