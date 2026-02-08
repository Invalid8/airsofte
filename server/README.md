# Airsofte Gemini API Server

Backend service that provides secure, server-side access to the Google Gemini API for AI-driven gameplay systems in **Airsofte**.

This server acts as an AI orchestration layer, generating missions, tactical guidance, live commentary, and narrative reports while enforcing validation, rate limits, and session isolation.

## Core AI Features

### Mission Generation

Dynamically generates structured space shooter missions based on difficulty, theme, and wave count. Missions include objectives, enemy wave definitions, and in-game dialogue.

- **Constraints**: Only BASIC, SCOUT, BOMBER enemies (no BOSS)
- **Patterns**: STRAIGHT, WAVE, ZIGZAG, CIRCLE, CHASE, TELEPORT
- **Objectives**: DESTROY, SURVIVE, COLLECT, COMBO
- **Difficulty-based enemy scaling**: Easy (4-6), Normal (7-10), Hard (11-15) enemies per wave
- **Enforced structure**: Exactly 3 dialogue entries (START, MID, END)

### Enhanced Tactical Hints

Session-aware tactical advice that adapts to player behavior over time. Uses combat context such as combo multipliers, active power-ups, recent events, and inferred playstyle to deliver urgent and situational guidance.

- **Player style tracking**: Aggressive, Risky, Skilled, Tactical
- **Context-aware**: Adapts to health status, enemy composition, and power-up state
- **Session persistence**: Maintains context across multiple hint requests

### Live Game Commentary

Generates short, high-impact commentary in response to gameplay events such as combos, boss spawns, near-death moments, and perfect waves.

- **Event types**: COMBO, NEAR_DEATH, BOSS_SPAWN, BOSS_DEFEAT, EPIC_KILL, WAVE_COMPLETE, POWER_UP, PERFECT_WAVE
- **Rate-limited**: 2-second cooldown per session to avoid spam
- **Context-aware**: References recent gameplay events for continuity

### Mission Reports

Produces narrative, military-style debriefings after each mission. Reports summarize performance, outcomes, and optionally continue story threads across missions.

- **Narrative continuity**: Can reference previous mission reports
- **Performance analysis**: Includes tactical assessment based on score, enemies defeated, and damage taken
- **Dynamic tone**: Adjusts between victory commendation and defeat encouragement

## Infrastructure Features

- ✅ API rate limiting per IP (100 requests per 15 minutes)
- ✅ CORS origin restrictions
- ✅ Helmet security headers
- ✅ Session-based AI context tracking with auto-cleanup (30-minute TTL)
- ✅ Comprehensive input validation on all endpoints
- ✅ Health check and Gemini connectivity verification
- ✅ **Interactive Swagger/OpenAPI documentation**
- ✅ Request logging with sanitized session IDs
- ✅ Retry logic with exponential backoff for rate limits

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
[https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### 3. Run Development Server

```bash
npm run dev
```

Server will start at `http://localhost:3001`

### 4. Build and Run for Production

```bash
npm run build
npm start
```

## API Documentation

### Interactive Swagger UI

Visit `http://localhost:3001/api-docs` for full interactive API documentation with:
- Complete request/response schemas
- Try-it-out functionality
- Example payloads
- Response codes and descriptions

## API Endpoints

### Health Check

```http
GET /health
```

Returns server status, uptime, and Gemini API connectivity.

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1234567890,
  "uptime": 123.45,
  "geminiConnected": true
}
```

---

### Generate Mission

```http
POST /api/generate-mission
```

**Request:**
```json
{
  "difficulty": "Normal",
  "theme": "asteroid field combat",
  "waveCount": 5
}
```

**Validation:**
- `difficulty`: Must be "Easy", "Normal", or "Hard"
- `waveCount`: Must be between 2 and 10
- `theme`: Optional string for mission theming

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Asteroid Assault",
    "description": "Navigate through a dense asteroid field...",
    "objectives": [...],
    "waves": [...],
    "dialogue": [...]
  },
  "timestamp": 1234567890
}
```

---

### Enhanced Tactical Hint

```http
POST /api/tactical-hint
```

**Request:**
```json
{
  "playerHealth": 45,
  "enemyTypes": ["SCOUT", "BOMBER"],
  "playerWeapon": "Plasma Rifle",
  "waveNumber": 3,
  "comboMultiplier": 2,
  "activePowerUps": ["Shield", "Double Damage"],
  "sessionId": "session-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hint": "Critical health! Dodge and grab that health pack!"
  },
  "timestamp": 1234567890
}
```

---

### Live Game Commentary

```http
POST /api/commentary
```

**Request:**
```json
{
  "eventType": "COMBO",
  "context": {
    "comboMultiplier": 5,
    "playerHealth": 80
  },
  "sessionId": "session-123"
}
```

**Valid Event Types:**
- `COMBO`: High combo multiplier achieved
- `NEAR_DEATH`: Player health critical
- `BOSS_SPAWN`: Boss enemy appears
- `BOSS_DEFEAT`: Boss defeated
- `EPIC_KILL`: Multiple enemies destroyed quickly
- `WAVE_COMPLETE`: Wave finished
- `POWER_UP`: Power-up collected
- `PERFECT_WAVE`: Wave completed with no damage

**Response:**
```json
{
  "success": true,
  "data": {
    "commentary": "INSANE! Five enemies eliminated in three seconds! 🔥",
    "throttled": false
  },
  "timestamp": 1234567890
}
```

**Note:** If called within 2 seconds of the last commentary for the same session, returns `commentary: ""` and `throttled: true`.

---

### Mission Report

```http
POST /api/mission-report
```

**Request:**
```json
{
  "missionName": "Operation Starfall",
  "outcome": "victory",
  "score": 125000,
  "enemiesDefeated": 87,
  "damageTaken": 35,
  "previousReports": []
}
```

**Validation:**
- `outcome`: Must be "victory" or "defeat"
- `previousReports`: Optional array of previous report strings for narrative continuity

**Response:**
```json
{
  "success": true,
  "data": {
    "report": "Mission Operation Starfall concluded with decisive victory. Pilot demonstrated exceptional combat prowess..."
  },
  "timestamp": 1234567890
}
```

---

### Session Cleanup

```http
DELETE /api/session/:sessionId
```

Clears stored AI context for the given session.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Session cleaned up"
  },
  "timestamp": 1234567890
}
```

**Note:** Sessions automatically expire after 30 minutes of inactivity.

## Rate Limiting

- **Window**: 15 minutes (900,000ms)
- **Max requests**: 100 per IP
- **Fully configurable** via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS`
- **Gemini API**: Automatic retry with exponential backoff on 429 errors

**Rate Limit Response:**
```json
{
  "success": false,
  "error": "Too many requests, please try again later",
  "timestamp": 1234567890
}
```

## Session Management

Sessions store:
- Recent gameplay events (up to 10)
- Inferred player style (aggressive, risky, skilled, tactical)
- Last commentary timestamp for throttling
- Last activity timestamp for auto-cleanup

**Cleanup:**
- Manual: `DELETE /api/session/:sessionId`
- Automatic: Sessions expire after 30 minutes of inactivity
- Background task runs every 5 minutes

## AI Model

Currently using **Gemini 2.5 Flash** (`gemini-2.5-flash`) with:
- Temperature: 0.9 (creative, varied responses)
- Max output tokens: 8192
- JSON response format enforced
- Retry logic with exponential backoff

## Deployment

### Render

1. Create a new Web Service
2. Connect the GitHub repository
3. **Build command:**
   ```bash
   cd server && npm install && npm run build
   ```
4. **Start command:**
   ```bash
   cd server && npm start
   ```
5. Configure environment variables in the dashboard:
   - `GEMINI_API_KEY`
   - `NODE_ENV=production`
   - `CORS_ORIGIN` (comma-separated production URLs)

### Railway

1. Deploy directly from GitHub
2. Add environment variables:
   - `GEMINI_API_KEY`
   - `NODE_ENV=production`
3. Node.js is auto-detected
4. Railway automatically runs `npm install` and `npm start`

### Vercel

Requires converting Express routes into serverless functions under `api/`.
**Not recommended** for this architecture due to session state requirements.

## Security Model

- ✅ Gemini API key never exposed to clients
- ✅ Strict input validation on all AI endpoints
- ✅ CORS origin allowlist
- ✅ Helmet security headers
- ✅ Request size limits enforced (10MB max)
- ✅ Session IDs sanitized in logs
- ✅ No session authorization bypass (404 on non-existent sessions)

## Monitoring & Debugging

### Health Check

```bash
curl http://localhost:3001/health
```

### Swagger UI

Visit `http://localhost:3001/api-docs` to test endpoints interactively.

### Logs

All requests are logged with:
```
[2025-02-08T12:34:56.789Z] POST /api/generate-mission - 200 (1234ms)
```

**Production logs:**
- **Render**: Dashboard → Logs
- **Railway**: Project → Deployments → Logs

### Test with cURL

```bash
# Mission generation
curl -X POST http://localhost:3001/api/generate-mission \
  -H "Content-Type: application/json" \
  -d '{"difficulty":"Normal","waveCount":3}'

# Tactical hint
curl -X POST http://localhost:3001/api/tactical-hint \
  -H "Content-Type: application/json" \
  -d '{"playerHealth":50,"enemyTypes":["SCOUT"],"playerWeapon":"Laser","waveNumber":2,"sessionId":"test-123"}'

# Commentary
curl -X POST http://localhost:3001/api/commentary \
  -H "Content-Type: application/json" \
  -d '{"eventType":"COMBO","context":{"comboMultiplier":3},"sessionId":"test-123"}'
```

## Development Commands

```bash
npm run dev          # Hot reload with tsx
npm run build        # Compile TypeScript
npm run type-check   # Type check without emitting files
npm start            # Run production build
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error message here",
  "timestamp": 1234567890
}
```

**Common HTTP status codes:**
- `200`: Success
- `400`: Invalid request parameters
- `404`: Resource not found (e.g., session)
- `429`: Rate limit exceeded
- `500`: Server or AI generation error

## Architecture Highlights

### Input Validation
Every endpoint validates:
- Required fields presence
- Type constraints
- Enum values
- Numeric ranges
- Array structures

### AI Output Validation
Generated missions are validated against:
- Enemy type constraints
- Movement pattern constraints
- Objective type constraints
- Wave count matching request
- Dialogue structure (exactly 3 entries with START/MID/END)
- Difficulty-based enemy count ranges

### Response Consistency
All responses follow the `ApiResponse<T>` type:
```typescript
{
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}
```

## License

MIT

## Support

For issues or questions:
1. Check the Swagger docs at `/api-docs`
2. Review server logs for error details
3. Verify environment variables are set correctly
4. Ensure Gemini API key is valid and has quota
