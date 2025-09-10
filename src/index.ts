import { extractInteractions, ExtractParams } from './analytics/extractInteractions';
import { env, parseCsv } from './config/env';
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

  const params: ExtractParams = {
    day: args.day,
    windowStart: args.start,
    windowEnd: args.end,
    orgTz: env.ORG_TIMEZONE,
    previousDayBuffer: 1,
    queueIds: args.queues,
    userIds: args.users,
    downloadDir: env.DOWNLOAD_DIR,
  };

  const conversations = await extractInteractions(apis.analytics, params);
  console.log(JSON.stringify(conversations));

  // eslint-disable-next-line no-console
  console.log(
    `Found ${conversations.length} interactions in ${args.day} ${args.start}-${args.end} (${env.ORG_TIMEZONE}).`
  );

  // List of Unique Conversation ids
  const ids = [...new Set(conversations.map(c => c.conversationId).filter(Boolean))];
  // eslint-disable-next-line no-console
  console.log(ids);
  const recordings = await extractRecordingMetadata(apis.recording, ids, params);
  // eslint-disable-next-line no-console
  console.log(recordings);
  const { failed, downloaded } = await processRecordings({
    recordingApi: apis.recording,
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
