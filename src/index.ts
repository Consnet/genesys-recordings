import { extractInteractions, ExtractParams } from './analytics/extractInteractions';
import { env, parseCsv } from './config/env';
import { getAgentIds } from './config/loadAgentNames';
import { initGenesysApis } from './genesys/client';
import { processRecordings } from './recordings/downloadRecordings';
import { extractRecordingMetadata } from './recordings/extractRecordingMeta';

interface CliArgs {
  day: string;
  start: string;
  end: string;
  queues: string[];
  users: string[];
}

function parseArgs(argv: string[]): CliArgs {
  const get = (flag: string): string | undefined => {
    const idx = argv.indexOf(flag);
    return idx >= 0 ? argv[idx + 1] : undefined;
  };

  const day =
    get('--day') ??
    env.DEFAULT_DAY ??
    ((): string => {
      throw new Error('Missing --day');
    })();
  const start = get('--start') ?? env.DEFAULT_WINDOW_START ?? '10:00';
  const end = get('--end') ?? env.DEFAULT_WINDOW_END ?? '11:00';

  const queues = parseCsv(get('--queues') ?? env.DEFAULT_QUEUE_IDS);
  const users = parseCsv(get('--users') ?? env.DEFAULT_USER_IDS);

  return { day, start, end, queues, users };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const apis = await initGenesysApis(env);
  const agentFromFile = await getAgentIds(apis.users);

  const users = agentFromFile.length > 0 ? agentFromFile : args.users;

  let day = '';
  if (!args.day.trim) {
    const today = new Date().toISOString().split('T')[0];
    day = today ?? '';
  } else {
    day = args.day;
  }

  const params: ExtractParams = {
    day: day,
    windowStart: args.start,
    windowEnd: args.end,
    orgTz: env.ORG_TIMEZONE,
    previousDayBuffer: env.PREVIOUS_DAY_BUFFER,
    queueIds: args.queues,
    userIds: users,
    downloadDir: env.DOWNLOAD_DIR,
  };

  const conversations = await extractInteractions(apis.analytics, params);

  // eslint-disable-next-line no-console
  console.log(
    `Found ${conversations.length} interactions in ${args.day} ${args.start}-${args.end} (${env.ORG_TIMEZONE}).`
  );

  // List of Unique Conversation ids
  const ids = [...new Set(conversations.map(c => c.conversationId).filter(Boolean))];

  const recordings = await extractRecordingMetadata(apis.recording, ids, conversations, params);

  const { failed, downloaded } = await processRecordings({
    apis,
    recordings,
    conversations,
    params,
  });
  console.log(`Download Completed. Failed: ${failed} Succeeded: ${downloaded}`);
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
