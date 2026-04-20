# syntax=docker/dockerfile:1.7
FROM oven/bun:1.1-slim AS base

WORKDIR /app

FROM base AS deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

FROM base AS build
COPY package.json bun.lockb tsconfig.json ./
RUN bun install --frozen-lockfile
COPY src/ ./src/
RUN bun build ./src/daemon.ts --outdir ./dist --target bun

FROM base AS runtime
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
EXPOSE ${GATEWAY_PORT:-18791}

CMD ["bun", "dist/daemon.js"]