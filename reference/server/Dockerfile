FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
COPY ../../sdk-typescript ./sdk-typescript
RUN pnpm install --frozen-lockfile

FROM base AS runtime
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY ../../v1/rules ./v1-rules
ENV RULES_DIR=/app/v1-rules
ENV PORT=7474
EXPOSE 7474
CMD ["pnpm", "start"]
