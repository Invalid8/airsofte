# Airsofte Gemini API Server

Backend service that provides secure access to Google Gemini API for AI-powered game features.

## Features

- **Mission Generation**: AI-powered dynamic mission creation
- **Tactical Hints**: Real-time gameplay advice
- **Mission Reports**: Narrative debriefings after missions
- **Rate Limiting**: Prevents API abuse
- **CORS Protection**: Secure cross-origin requests
- **Health Monitoring**: Status endpoint for uptime checks

## Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Variables

Create `.env` file:

```env
GEMINI_API_KEY=your_actual_gemini_api_key
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

Get your Gemini API key from: https://makersuite.google.com/app/apikey

### 3. Run Development Server

```bash
npm run dev
```

### 4. Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Health Check

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": 1704067200000,
  "uptime": 123.456,
  "geminiConnected": true
}
```

### Generate Mission

```
POST /api/generate-mission
```

Request Body:
```json
{
  "difficulty": "Normal",
  "theme": "asteroid field combat",
  "waveCount": 3
}
```

Response:
```json
{
  "success": true,
  "data": {
    "title": "Asteroid Gauntlet",
    "description": "Navigate through a dense asteroid field...",
    "objectives": [...],
    "waves": [...],
    "dialogue": [...]
  },
  "timestamp": 1704067200000
}
```

### Get Tactical Hint

```
POST /api/tactical-hint
```

Request Body:
```json
{
  "playerHealth": 65,
  "enemyTypes": ["BASIC", "SCOUT"],
  "playerWeapon": "DOUBLE",
  "waveNumber": 3
}
```

Response:
```json
{
  "success": true,
  "data": {
    "hint": "Focus fire on scouts, they're faster"
  },
  "timestamp": 1704067200000
}
```

### Generate Mission Report

```
POST /api/mission-report
```

Request Body:
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

Response:
```json
{
  "success": true,
  "data": {
    "report": "Mission debriefing text..."
  },
  "timestamp": 1704067200000
}
```

## Rate Limiting

- **Window**: 15 minutes (configurable)
- **Max Requests**: 100 per window (configurable)
- **Per**: IP address

## Deployment

### Render.com

1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `cd server && npm install && npm run build`
4. Set start command: `cd server && npm start`
5. Add environment variables in dashboard

### Railway.app

1. New Project → Deploy from GitHub
2. Add environment variables
3. Railway auto-detects Node.js and builds

### Vercel (Serverless Functions)

Convert routes to serverless functions in `api/` directory.

## Security

- ✅ API key stored server-side only
- ✅ Rate limiting prevents abuse
- ✅ CORS restricts origins
- ✅ Helmet.js security headers
- ✅ Request size limits (10MB)
- ✅ Input validation on all endpoints

## Monitoring

Check server health:
```bash
curl http://localhost:3001/health
```

View logs in production:
- **Render**: Dashboard → Logs
- **Railway**: Project → Deployments → Logs

## Troubleshooting

**"GEMINI_API_KEY is not set"**
- Add API key to `.env` file
- Restart server after adding

**CORS errors**
- Add frontend URL to `CORS_ORIGIN` in `.env`
- Format: `http://localhost:5173,http://localhost:5174`

**Rate limit errors**
- Increase `RATE_LIMIT_MAX_REQUESTS`
- Increase `RATE_LIMIT_WINDOW_MS`

## Development

```bash
npm run dev          # Start with hot reload
npm run build        # Compile TypeScript
npm run type-check   # Check types without building
```