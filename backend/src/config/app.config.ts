const DEFAULT_PORT = 8080;
const DEFAULT_ALLOWED_ORIGINS = "http://localhost:3000";

export interface AllowedOrigins {
  allowAll: boolean;
  values: Set<string>;
}

export function getPort(): number {
  const rawPort = process.env.PORT?.trim();
  if (!rawPort) {
    return DEFAULT_PORT;
  }

  const port = Number.parseInt(rawPort, 10);
  return Number.isInteger(port) && port > 0 ? port : DEFAULT_PORT;
}

export function getAllowedOrigins(): AllowedOrigins {
  const rawOrigins = process.env.ALLOWED_ORIGINS?.trim() || DEFAULT_ALLOWED_ORIGINS;
  const origins = rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    allowAll: origins.includes("*"),
    values: new Set(origins.filter((origin) => origin !== "*")),
  };
}
