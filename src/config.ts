export interface AppConfig {
  port: number;
  model: string;
  apiKey?: string;
  logLevel: string;
}

function positiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadConfig(): AppConfig {
  return {
    port: positiveInt(process.env.PORT, 3000),
    model: process.env.TYPESAFE_MODEL ?? "jev-latest",
    apiKey: process.env.TYPESAFE_API_KEY || undefined,
    logLevel: process.env.LOG_LEVEL ?? "info",
  };
}
