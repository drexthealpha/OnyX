# packages/onyx-gateway/Dockerfile
FROM node:22-alpine
RUN npm install -g pnpm@9
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/onyx-gateway/package.json ./packages/onyx-gateway/
COPY kernel/ ./kernel/
RUN pnpm install --frozen-lockfile --filter @onyx/gateway
COPY packages/onyx-gateway/ ./packages/onyx-gateway/
RUN pnpm --filter @onyx/gateway build
EXPOSE 18789
CMD ["node", "packages/onyx-gateway/dist/index.js"]