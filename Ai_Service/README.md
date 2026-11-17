# Production-Ready Node.js/Express AI Microservice (Phase 1)

A production-conscious, lightweight AI microservice built with Node.js, Express, and Google's official Gemini SDK (`@google/genai`). Designed with modularity, resilient model failover, and strict separation of concerns, ready for seamless Phase 2 LangChain RAG integration.

---

## 1. Technology Stack

- **Runtime:** Node.js v20+ or v24+
- **Module System:** Native ES Modules (`"type": "module"`)
- **Framework:** Express.js `^4.21.2`
- **Official Google AI SDK:** `@google/genai` `^2.30.0`
- **Environment Configuration:** `dotenv`
- **CORS:** `cors`
- **Testing:** Node.js built-in test runner (`node:test`)
- **Development:** Native Node.js `--watch`

---

## 2. Project Directory Structure

```text
ai-service/
├── .env.example
├── .gitignore
├── package.json
├── README.md
│
├── test/
│   ├── ai.service.test.js
│   └── ai.routes.test.js
│
└── src/
    ├── app.js
    ├── server.js
    │
    ├── config/
    │   ├── env.js
    │   └── gemini.js
    │
    ├── controllers/
    │   └── ai.controller.js
    │
    ├── routes/
    │   ├── ai.routes.js
    │   └── health.routes.js
    │
    ├── services/
    │   └── ai/
    │       └── gemini.service.js
    │
    └── utils/
        ├── ApiError.js
        ├── asyncHandler.js
        └── logger.js
```

---

## 3. Prerequisites

- **Node.js:** v20.x or v24.x or higher
- **npm:** v9.x or higher
- **Google Gemini API Key:** From [Google AI Studio](https://aistudio.google.com/)

---

## 4. Installation Instructions

```bash
# Navigate to the microservice directory
cd Ai_Service

# Install dependencies
npm install
```

---

## 5. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
NODE_ENV=development
PORT=5001

# Google Gemini API
GEMINI_API_KEY=your_actual_gemini_api_key

# Gemini model priority (comma-separated, in priority order)
GEMINI_MODELS=gemini-3.5-flash-lite,gemini-flash-lite-latest,gemini-3.1-flash-lite

# Gemini reliability configuration
GEMINI_TIMEOUT_MS=30000
GEMINI_MAX_RETRIES_PER_MODEL=1
GEMINI_RETRY_BASE_DELAY_MS=300
GEMINI_RETRY_MAX_DELAY_MS=2000

# Request limits
MAX_PROMPT_LENGTH=20000
MAX_HISTORY_MESSAGES=30
MAX_HISTORY_MESSAGE_LENGTH=10000
JSON_BODY_LIMIT=1mb

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## 6. How to Obtain a Gemini API Key

1. Navigate to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click **"Get API key"** in the top navigation.
4. Select or create a Google Cloud project.
5. Copy the generated key and assign it to `GEMINI_API_KEY` in your `.env` file.

---

## 7. How to Start the Server

```bash
# Production start
npm start

# Development mode with native Node file watching
npm run dev
```

---

## 8. How to Execute Tests

The test suite runs against mocked SDK adapters to ensure tests do not require a live API key or consume API quota:

```bash
npm test
```

---

## 9. API Endpoint Documentation

### 1. Health Check
- **Route:** `GET /health`
- **Description:** Checks application process liveness without calling Gemini.
- **Response `200 OK`:**
  ```json
  {
    "status": "ok",
    "service": "ai-microservice",
    "uptime": 123.45
  }
  ```

### 2. Text Generation
- **Route:** `POST /api/ai/generate`
- **Request Body:**
  ```json
  {
    "prompt": "Explain quantum computing in simple terms.",
    "systemInstruction": "You are a concise science tutor.",
    "temperature": 0.3,
    "context": "Optional retrieved context chunks for RAG"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "model": "gemini-3.5-flash-lite",
    "durationMs": 850,
    "content": "Quantum computing is a rapidly-emerging technology..."
  }
  ```

### 3. Chat Generation
- **Route:** `POST /api/ai/chat`
- **Request Body:**
  ```json
  {
    "message": "Hello!",
    "history": [
      { "role": "user", "text": "Hi" },
      { "role": "model", "text": "Hello! How can I help?" }
    ],
    "systemInstruction": "You are a helpful assistant.",
    "context": "Optional retrieved context chunks"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "model": "gemini-3.5-flash-lite",
    "durationMs": 920,
    "reply": "Hello! How can I help you today?"
  }
  ```

---

## 10. Example API Commands

### Text Generation (`/generate`)

#### cURL (Bash):
```bash
curl -X POST http://localhost:5001/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing in simple terms.",
    "systemInstruction": "You are a concise science tutor.",
    "temperature": 0.3
  }'
```

#### PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:5001/api/ai/generate" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body (@{
    prompt = "Explain quantum computing in simple terms."
    systemInstruction = "You are a concise science tutor."
    temperature = 0.3
  } | ConvertTo-Json)
```

---

### Chat Generation (`/chat`)

#### cURL (Bash):
```bash
curl -X POST http://localhost:5001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello!",
    "history": [
      { "role": "user", "text": "Hi" },
      { "role": "model", "text": "Hello! How can I help?" }
    ],
    "systemInstruction": "You are a helpful assistant."
  }'
```

#### PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:5001/api/ai/chat" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body (@{
    message = "Hello!"
    history = @(
      @{ role = "user"; text = "Hi" },
      @{ role = "model"; text = "Hello! How can I help?" }
    )
    systemInstruction = "You are a helpful assistant."
  } | ConvertTo-Json)
```

---

## 11. Model Failover & Resiliency Explanation

The engine in `src/config/gemini.js` ensures high availability through:

1. **Attempting the Primary Model:** Starts with `gemini-3.5-flash-lite`.
2. **Error Classification:**
   - **Non-retryable (400, 401, 403):** Aborts immediately without retrying or switching models.
   - **Model Unavailable (404):** Skips the model immediately and tries the next configured fallback model.
   - **Transient (429, 500, 503):** Applies bounded exponential backoff with randomized jitter (`GEMINI_RETRY_BASE_DELAY_MS` to `GEMINI_RETRY_MAX_DELAY_MS`), then fails over to the next fallback model.
   - **Upstream Timeout:** Governed by an explicit `GEMINI_TIMEOUT_MS` timer.
3. **Tracking:** Returns the actual `modelUsed` in the response payload.

### Changing Model Priority
Update `GEMINI_MODELS` in `.env`:
```env
GEMINI_MODELS=gemini-3.5-flash-lite,gemini-flash-lite-latest,gemini-3.1-flash-lite
```

---

## 12. Error Response Format

Standardized error response format:
```json
{
  "success": false,
  "error": "A clear error message"
}
```

HTTP Status Codes used:
- `400`: Validation or malformed JSON error.
- `401`: Service authentication failure.
- `403`: Access forbidden or CORS policy violation.
- `404`: Route not found.
- `502`: Upstream provider failure.
- `503`: Upstream service unavailable / all models exhausted / request timeout.
- `500`: Internal unexpected error.

---

## 13. Phase 2 LangChain RAG Integration Notes

The service is pre-architected to accept an optional `context` field:

```javascript
{
  prompt: "...",
  context: "...",  // Retrieved passage chunks from Vector DB / pgvector
  systemInstruction: "...",
  temperature: 0.3
}
```

In Phase 2, a LangChain pipeline (LCEL `RunnableLambda`) can perform similarity search on a vector store and pipe the retrieved document chunks directly into `context`. The Gemini generation service remains cleanly decoupled from retrieval mechanics.
