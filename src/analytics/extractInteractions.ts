import type platformClient from 'purecloud-platform-client-v2';
import { ConversationsSchema } from '../genesys/analytics.types';
import { getValidConversations, ValidConversation } from './getValidConversations';
import {
  buildConversationDetailsQuery,
  type FiltersInput,
  type TechParams,
  type TimeWindowInput,
} from './queryBuilder';

export interface ExtractParams extends TimeWindowInput, FiltersInput, TechParams {}

export async function extractInteractions(
  analytics: Readonly<platformClient.AnalyticsApi>,
  params: Readonly<ExtractParams>
): Promise<ValidConversation[]> {
  const { body } = buildConversationDetailsQuery(params, params);

  const result: ValidConversation[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const res = await analytics.postAnalyticsConversationsDetailsQuery(body);
    if (!res?.conversations) {
      break;
    }
    const page = res.conversations ?? [];
    if (!Array.isArray(page) || page.length === 0) {
      break;
    }
    const rawConversations = ConversationsSchema.parse(page);
    //Get conversations and sessions within our timeframe we are interested in
    const validConversations = getValidConversations(rawConversations, params);
    result.push(...validConversations);

    const pageSize = body.paging?.pageSize ?? 100;
    if (page.length < pageSize) {
      break;
    }

    body.paging ??= { pageSize, pageNumber: 1 };
    body.paging.pageNumber = (body.paging.pageNumber ?? 1) + 1;
  }

  return result;
}
