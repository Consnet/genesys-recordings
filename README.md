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

- **Node.js** (v22 or newer recommended)
- **Yarn** (package manager)
- **Genesys Cloud credentials** with permissions to:
  - Analytics API
  - Recording API

---

## Installation

Clone this repo and install dependencies:

```bash
git clone https://github.com/your-org/genesys-recording-extractor.git
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

### CLI Arguments

| Flag       | Description                                                                 |
| ---------- | --------------------------------------------------------------------------- |
| `--day`    | The date of interactions to extract (required, format: `YYYY-MM-DD`)        |
| `--start`  | Start time for extraction window (default: from `env.DEFAULT_WINDOW_START`) |
| `--end`    | End time for extraction window (default: from `env.DEFAULT_WINDOW_END`)     |
| `--queues` | Comma-separated queue IDs to filter (default: `env.DEFAULT_QUEUE_IDS`)      |
| `--users`  | Comma-separated user IDs to filter (default: `env.DEFAULT_USER_IDS`)        |

### Example

```bash
yarn start   --day 2025-09-10   --start 09:00   --end 10:00   --queues 12345,67890   --users abcdef,ghijkl
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

- If `--day` is missing, the script will throw an error.
- If API calls fail (auth or network), the error will be logged, and the process will exit with code `1`.
- Failed downloads are reported but do not stop the process.

---

## Development

Run in watch mode during development:

```bash
yarn dev
```

Lint and fix issues:

```bash
yarn lint
yarn lint:fix
```

---

## Next Steps

- Add helper translations for WrapupCode, Team Leader, Agent Name
- Extend metadata mapping for reporting
- Support resumable/retry logic for failed downloads
