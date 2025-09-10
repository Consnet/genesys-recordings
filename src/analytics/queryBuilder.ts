import { DateTime } from 'luxon';
import type platformClient from 'purecloud-platform-client-v2';

export interface TimeWindowInput {
  /** YYYY-MM-DD in org timezone */
  readonly day: string;
  /** 24h "HH:mm" in org timezone */
  readonly windowStart: string;
  /** 24h "HH:mm" in org timezone */
  readonly windowEnd: string;
  /** IANA TZ, e.g., "Africa/Johannesburg" */
  readonly orgTz: string;
  /** include the previous day to catch long-lived conversations */
  readonly previousDayBuffer?: number; // default 1
}

export interface FiltersInput {
  readonly queueIds?: string[];
  readonly userIds?: string[];
}

export interface TechParams {
  downloadDir: string;
}

export interface BuiltQuery {
  body: platformClient.Models.ConversationQuery;
  hourStartUtc: string;
  hourEndUtc: string;
}

export function buildConversationDetailsQuery(t: TimeWindowInput, f: FiltersInput): BuiltQuery {
  const bufferDays = t.previousDayBuffer ?? 5;

  const hourStart = DateTime.fromFormat(`${t.day} ${t.windowStart}`, 'yyyy-MM-dd HH:mm', {
    zone: t.orgTz,
  });
  const hourEnd = DateTime.fromFormat(`${t.day} ${t.windowEnd}`, 'yyyy-MM-dd HH:mm', {
    zone: t.orgTz,
  });

  if (!hourStart.isValid || !hourEnd.isValid || hourEnd <= hourStart) {
    throw new Error('Invalid time window');
  }

  // Broad interval: [day - buffer, day] in UTC
  const intervalStartUtc = hourStart
    .startOf('day')
    .minus({ days: bufferDays })
    .toUTC()
    .toISO({ suppressMilliseconds: false });
  const intervalEndUtc = hourEnd.endOf('day').toUTC().toISO({ suppressMilliseconds: false });

  // Exact clamp range for the target hour
  const hourStartUtc = hourStart.toUTC().toISO({ suppressMilliseconds: false });
  const hourEndUtc = hourEnd.toUTC().toISO({ suppressMilliseconds: false });

  const queuePreds = (f.queueIds ?? []).map(id => ({
    type: 'dimension' as const,
    dimension: 'queueId',
    operator: 'matches' as const,
    value: id,
  }));

  const userPreds = (f.userIds ?? []).map(id => ({
    type: 'dimension' as const,
    dimension: 'userId',
    operator: 'matches' as const,
    value: id,
  }));

  const segmentFilters = [
    {
      type: 'or' as const,
      predicates: [
        {
          type: 'dimension' as const,
          dimension: 'mediaType',
          operator: 'matches' as const,
          value: 'voice',
        },
      ],
    },
    ...(queuePreds.length ? [{ type: 'or' as const, predicates: queuePreds }] : []),
    ...(userPreds.length ? [{ type: 'or' as const, predicates: userPreds }] : []),
  ];

  const conversationFilters = [
    {
      type: 'or' as const,
      predicates: [
        { type: 'metric' as const, metric: 'tAnswered', operator: 'exists' as const },
        { type: 'metric' as const, metric: 'tTalk', operator: 'exists' as const },
      ],
    },
  ];

  const body = {
    interval: `${intervalStartUtc}/${intervalEndUtc}`,
    order: 'asc',
    orderBy: 'conversationStart',
    segmentFilters,
    conversationFilters,
    paging: { pageSize: 100, pageNumber: 1 },
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  } as unknown as platformClient.Models.ConversationQuery;

  return { body, hourStartUtc, hourEndUtc };
}
