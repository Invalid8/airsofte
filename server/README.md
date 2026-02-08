# Airsofte Gemini API Server

Backend service that provides secure, server-side access to the Google Gemini API for AI-driven gameplay systems in **Airsofte**.

This server acts as an AI orchestration layer, generating missions, tactical guidance, live commentary, and narrative reports while enforcing validation, rate limits, and session isolation.

## Core AI Features

### Mission Generation

Dynamically generates structured space shooter missions based on difficulty, theme, and wave count. Missions include objectives, enemy wave definitions, and in-game dialogue.

### Tactical Hints

Provides real-time combat advice based on player state, enemy composition, weapon loadout, and wave progression.

### Enhanced Tactical Hints (New)

Session-aware tactical advice that adapts to player behavior over time.
Uses combat context such as combo multipliers, active power-ups, recent events, and inferred playstyle to deliver more urgent and situational guidance.

### Live Game Commentary (New)

Generates short, high-impact commentary in response to gameplay events such as combos, boss spawns, near-death moments, and perfect waves.
Commentary is rate-limited per session to avoid spam and maintains contextual continuity.

### Mission Reports

Produces narrative, military-style debriefings after each mission. Reports summarize performance, outcomes, and optionally continue story threads across missions.

## Infrastructure Features

* API rate limiting per IP
* CORS origin restrictions
* Helmet security headers
* Session-based AI context tracking
* Input validation on all endpoints
* Health check and Gemini connectivity verification

## Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Variables

Create a `.env` file:

```env
GEMINI_API_KEY=your_actual_gemini_api_key
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

Get a Gemini API key from:
[https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

### 3. Run Development Server

```bash
npm run dev
```

### 4. Build and Run for Production

```bash
npm run build
npm start
```

## API Endpoints

### Health Check

```
GET /health
```

Returns server status, uptime, and Gemini API connectivity.

---

### Generate Mission

```
POST /api/generate-mission
```

Request body:

```json
{
  "difficulty": "Normal",
  "theme": "asteroid field combat",
  "waveCount": 3
}
```

---

### Tactical Hint

```
POST /api/tactical-hint
```

Request body:

```json
{
  "playerHealth": 65,
  "enemyTypes": ["BASIC", "SCOUT"],
  "playerWeapon": "DOUBLE",
  "waveNumber": 3,
  "sessionId": "abc123"
}
```

---

### Live Game Commentary (New)

```
POST /api/commentary
```

Request body:

```json
{
  "eventType": "COMBO",
  "context": {
    "comboMultiplier": 4
  },
  "sessionId": "abc123"
}
```

Returns a short, hype-style commentary line. May return an empty string if commentary is rate-limited.

---

### Mission Report

```
POST /api/mission-report
```

Request body:

```json
{
  "missionName": "First Contact",
  "outcome": "victory",
  "score": 12500,
  "enemiesDefeated": 45,
  "damageTaken": 30,
  "previousReports": []
}
```

---

### Session Cleanup

```
DELETE /api/session/:sessionId
```

Clears stored AI context for the given session.

## Rate Limiting

* Window: 15 minutes
* Max requests: 100 per IP
* Fully configurable via environment variables

## Deployment

### Render

1. Create a new Web Service
2. Connect the GitHub repository
3. Build command:

   ```
   cd server && npm install && npm run build
   ```
4. Start command:

   ```
   cd server && npm start
   ```
5. Configure environment variables in the dashboard

### Railway

* Deploy directly from GitHub
* Add environment variables
* Node.js is auto-detected

### Vercel

Requires converting Express routes into serverless functions under `api/`.

## Security Model

* Gemini API key never exposed to clients
* Strict input validation on all AI endpoints
* CORS origin allowlist
* Helmet security headers
* Request size limits enforced

## Monitoring

Health check:

```bash
curl http://localhost:3001/health
```

Logs:

* Render: Dashboard → Logs
* Railway: Project → Deployments → Logs

## Development Commands

```bash
npm run dev          # Hot reload with tsx
npm run build        # Compile TypeScript
npm run type-check   # Type check without emitting files
```