# Expert Interview Evaluator - Analysis Server

This is a standalone analysis server for the Expert Interview Evaluator project. It processes completed interview sessions, analyzes the expert feedback, and generates insights.

## How It Works

The analysis server:

1. Listens for analysis requests from the main Next.js application
2. Polls the database for unprocessed completed sessions
3. Analyzes interview transcripts using OpenAI
4. Stores analysis artifacts and session summaries in the database

## Setup

1. Install dependencies:

   ```
   npm install
   ```

   or

   ```
   pnpm install
   ```

2. Create a `.env` file with the following variables:

   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/database
   OPENAI_API_KEY=your_openai_api_key
   ANALYSIS_SERVER_PORT=3001
   ```

3. Build the server:
   ```
   npm run build
   ```
   or
   ```
   pnpm build
   ```

## Running the Server

Start the server in development mode:

```
npm run dev
```

Start the server in production mode:

```
npm start
```

## API Endpoints

### POST /analyze/:sessionId

Triggers analysis for a specific interview session.

- Path Parameters:

  - `sessionId`: ID of the interview session to analyze

- Response:
  - Status: 202 Accepted
  - Body: `{ "message": "Analysis job queued" }`

### GET /health

Health check endpoint.

- Response:
  - Status: 200 OK
  - Body: `{ "status": "ok" }`

## Integration with Next.js App

The main Next.js application should be configured with the following environment variable:

```
ANALYSIS_SERVER_URL=http://localhost:3001
```

When an interview session is completed, the Next.js app will make a non-blocking request to the analysis server to trigger processing.
