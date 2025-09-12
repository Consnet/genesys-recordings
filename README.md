# Genesys Recording Extractor

This project extracts **interactions** and associated **recordings** from Genesys Cloud Analytics and Recording APIs, then downloads the files locally for analysis or archiving.

---

## Features

- Connects to Genesys Cloud APIs (Analytics + Recording)
- Extracts interaction data for a given day/time window
- Collects recording metadata (per conversation ID)
- Downloads audio recordings locally
- Downloads a CSV file
- Supports filtering by:
  - Queue IDs
  - User IDs (agents)
- Provides clear logging of successes/failures

---

## Requirements

- **Node.js** (v18 or newer recommended)
- **Yarn** (package manager if developing)
- **Genesys Cloud credentials** with permissions to:
  - Analytics API
  - Recording API

---

## Installation

Clone this repo and install dependencies:

```bash
git clone https://github.com/Consnet/genesys-recordings.git
cd genesys-recording-extractor
yarn install
```

Build the project (if using TypeScript):

```bash
yarn build
```

If you don't use yarn, you can use the following **npm** commands in place of that:

```bash
npm install
npm run build
```

Note, on Windows your build may fail with lots of prettier complaints. Execute the below command in the project root directory before a build:

```bash
npx prettier --write .
```

---

## Configuration

You must create a `.env` file in the project root as a copy of `.env.sample` and maintain the values for the variables below:

| Variable               | Description                                                      |
| ---------------------- | ---------------------------------------------------------------- |
| `DEFAULT_DAY`          | Default day to query (e.g. `2025-09-10`)                         |
| `DEFAULT_WINDOW_START` | Start time for window (e.g. `10:00`)                             |
| `DEFAULT_WINDOW_END`   | End time for window (e.g. `11:00`)                               |
| `DEFAULT_QUEUE_IDS`    | Comma-separated list of queue IDs                                |
| `DEFAULT_USER_IDS`     | Comma-separated list of user IDs (agents)                        |
| `ORG_TIMEZONE`         | Organization timezone (e.g. `Africa/Johannesburg`)               |
| `DOWNLOAD_DIR`         | Local directory path to save recordings                          |
| Genesys credentials    | (`GENESYS_CLIENT_ID`, `GENESYS_CLIENT_SECRET`, `GENESYS_REGION`) |

---

## Usage

Run the script with CLI arguments:

```bash
yarn start --day 2025-09-10 --start 10:00 --end 11:00 --queues Q123,Q456 --users U123,U456
```

Or with Node after a build:

```bash
node dist/index.js --day 2025-09-10 --start 10:00 --end 11:00 --queues Q123,Q456 --users U123,U456
```

### CLI Arguments

Note all arguments are optional and don't have to be provided.

| Flag       | Description                                                                 |
| ---------- | --------------------------------------------------------------------------- |
| `--day`    | The date of interactions to extract (required, format: `YYYY-MM-DD`)        |
| `--start`  | Start time for extraction window (default: from `env.DEFAULT_WINDOW_START`) |
| `--end`    | End time for extraction window (default: from `env.DEFAULT_WINDOW_END`)     |
| `--queues` | Comma-separated queue IDs to filter (default: `env.DEFAULT_QUEUE_IDS`)      |
| `--users`  | Comma-separated user IDs to filter (default: `env.DEFAULT_USER_IDS`)        |

### Parameter Behaviour

| Parameter | Description                                                                 |
| --------- | --------------------------------------------------------------------------- |
| DAY       | Optional: can be provided via CLI or .env file. If not provided, calls will |
|           | be extracted for the current day                                            |
| START     | Mandatory: From `env.DEFAULT_WINDOW_START`) or cli `--start` in local time  |
| END       | Mandatory: From `env.DEFAULT_WINDOW_END`) or cli `--end` in local time      |
| QUEUES    | Optional: (from: `env.DEFAULT_QUEUE_IDS`). If not provided will download    |
|           | all queues                                                                  |
| USERS     | Optional: Comma-separated Genesys userIDs in `.env` file or can be provided |
|           | in `agents.json` file in root of the project. If no agents are provided     |
|           | the script will download interactions for all agents                        |

**agents.json**
You can create a file in this format in the root of the project directory to restrict the download to specific agents

```json
["Agent Name1", "Agent Name2"]
```

### Example

```bash
yarn start   --day 2025-09-10   --start 09:00   --end 10:00   --queues 12345,67890   --users abcdef,ghijkl
```

Without yarn:

```bash
node dist/index.js \
  --day 2025-09-10 \
  --start 09:00 \
  --end 10:00 \
  --queues 12345,67890 \
  --users abcdef,ghijkl
```

This will:

1. Extract all conversations in the given timeframe.
2. Collect unique conversation IDs.
3. Retrieve recording metadata.
4. Download available recordings into `DOWNLOAD_DIR`.

---

## Output

During execution, the script will log:

- JSON representation of extracted conversations
- List of unique conversation IDs
- Recording metadata
- Download results summary:

```
Download Completed. Failed: 2 Succeeded: 14
```

Recordings are saved under the configured `DOWNLOAD_DIR`.

---

## Error Handling

- If `START` or `END` is missing, the script will throw an error.
- If API calls fail (auth or network), the error will be logged, and the process will exit with code `1`.
- Failed downloads are reported but do not stop the process.

---

## Development

Run in watch mode during development:

```bash
yarn dev
```

or:

```bash
npm run dev
```

Lint and fix issues:

```bash
yarn lint
yarn lint:fix
```

or:

```bash
npm run lint
npm run lint:fix
```

---

## Next Steps

- Add helper translations for WrapupCode, Team Leader, Agent Name
- Extend metadata mapping for reporting
- Support resumable/retry logic for failed downloads
