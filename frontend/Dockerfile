# syntax=docker/dockerfile:1

FROM oven/bun:1 AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Optional target for standard Next.js server mode.
# Use only after removing output: "export" from next.config.ts.
FROM base AS runner-standard
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nextjs \
  && useradd --system --uid 1001 --gid nextjs --home-dir /app nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules

USER nextjs
EXPOSE 3000

CMD ["bun", "run", "start"]

# Optional target for Next.js standalone server mode.
# Use only after setting output: "standalone" in next.config.ts.
FROM base AS runner-standalone
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nextjs \
  && useradd --system --uid 1001 --gid nextjs --home-dir /app nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/standalone ./

USER nextjs
EXPOSE 3000

CMD ["bun", "server.js"]

# Current app mode: next.config.ts uses output: "export", which writes static files to /app/out.
# This is intentionally the final stage, so `docker build .` creates the deployable image.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS static-runner
COPY --from=builder /app/out /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
