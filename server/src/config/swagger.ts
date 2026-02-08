import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Airsofte Gemini API",
      version: "1.0.0",
      description:
        "AI-powered game content generation API for space shooter missions",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Development server",
      },
    ],
    tags: [
      {
        name: "Health",
        description: "Server health endpoints",
      },
      {
        name: "Mission",
        description: "Mission generation endpoints",
      },
      {
        name: "Gameplay",
        description: "Real-time gameplay assistance",
      },
      {
        name: "Session",
        description: "Session management",
      },
    ],
    components: {
      schemas: {
        ApiResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
            },
            data: {
              type: "object",
            },
            error: {
              type: "string",
            },
            timestamp: {
              type: "number",
            },
          },
        },
        GenerateMissionRequest: {
          type: "object",
          required: ["difficulty", "waveCount"],
          properties: {
            difficulty: {
              type: "string",
              enum: ["Easy", "Normal", "Hard"],
              example: "Normal",
            },
            theme: {
              type: "string",
              example: "alien invasion",
            },
            waveCount: {
              type: "number",
              minimum: 2,
              maximum: 10,
              example: 5,
            },
          },
        },
        GeneratedMission: {
          type: "object",
          properties: {
            title: {
              type: "string",
              example: "Operation Starfall",
            },
            description: {
              type: "string",
              example: "Defend the outer colonies from an alien assault",
            },
            objectives: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: ["DESTROY", "SURVIVE", "COLLECT", "COMBO"],
                  },
                  target: {
                    type: "number",
                  },
                  description: {
                    type: "string",
                  },
                },
              },
            },
            waves: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  enemies: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: {
                          type: "string",
                          enum: ["BASIC", "SCOUT", "BOMBER"],
                        },
                        count: {
                          type: "number",
                        },
                        pattern: {
                          type: "string",
                          enum: [
                            "STRAIGHT",
                            "WAVE",
                            "ZIGZAG",
                            "CIRCLE",
                            "CHASE",
                            "TELEPORT",
                          ],
                        },
                        spawnDelay: {
                          type: "number",
                        },
                      },
                    },
                  },
                  spawnInterval: {
                    type: "number",
                  },
                },
              },
            },
            dialogue: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  character: {
                    type: "string",
                  },
                  text: {
                    type: "string",
                  },
                  timing: {
                    type: "string",
                    enum: ["START", "MID", "END"],
                  },
                },
              },
            },
          },
        },
        TacticalHintRequest: {
          type: "object",
          required: [
            "playerHealth",
            "enemyTypes",
            "playerWeapon",
            "waveNumber",
            "sessionId",
          ],
          properties: {
            playerHealth: {
              type: "number",
              example: 45,
            },
            enemyTypes: {
              type: "array",
              items: {
                type: "string",
              },
              example: ["SCOUT", "BOMBER"],
            },
            playerWeapon: {
              type: "string",
              example: "Plasma Rifle",
            },
            waveNumber: {
              type: "number",
              example: 3,
            },
            comboMultiplier: {
              type: "number",
              example: 2,
            },
            activePowerUps: {
              type: "array",
              items: {
                type: "string",
              },
              example: ["Shield", "Double Damage"],
            },
            sessionId: {
              type: "string",
              example: "session-123",
            },
          },
        },
        CommentaryRequest: {
          type: "object",
          required: ["eventType", "context", "sessionId"],
          properties: {
            eventType: {
              type: "string",
              enum: [
                "COMBO",
                "NEAR_DEATH",
                "BOSS_SPAWN",
                "BOSS_DEFEAT",
                "EPIC_KILL",
                "WAVE_COMPLETE",
                "POWER_UP",
                "PERFECT_WAVE",
              ],
              example: "COMBO",
            },
            context: {
              type: "object",
              properties: {
                playerHealth: {
                  type: "number",
                },
                comboMultiplier: {
                  type: "number",
                },
                enemiesDefeated: {
                  type: "number",
                },
                bossName: {
                  type: "string",
                },
                waveNumber: {
                  type: "number",
                },
                powerUpType: {
                  type: "string",
                },
                streak: {
                  type: "number",
                },
              },
            },
            sessionId: {
              type: "string",
              example: "session-123",
            },
          },
        },
        MissionReportRequest: {
          type: "object",
          required: [
            "missionName",
            "outcome",
            "score",
            "enemiesDefeated",
            "damageTaken",
          ],
          properties: {
            missionName: {
              type: "string",
              example: "Operation Starfall",
            },
            outcome: {
              type: "string",
              enum: ["victory", "defeat"],
              example: "victory",
            },
            score: {
              type: "number",
              example: 125000,
            },
            enemiesDefeated: {
              type: "number",
              example: 87,
            },
            damageTaken: {
              type: "number",
              example: 35,
            },
            previousReports: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts", "./src/index.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
