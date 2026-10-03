# ==============================================================================
# Vivelite ERP - Backend Multi-Stage Dockerfile (Production Optimized)
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@9

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN pnpm install --frozen-lockfile

COPY tsconfig*.json nest-cli.json ./
COPY src ./src/

# Variable temporal para permitir prisma generate durante el build de Docker
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public"

RUN pnpm exec prisma generate
RUN pnpm build

# Stage 2: Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000

COPY --from=builder /app/dist ./dist
# Prisma 7 with pnpm stores the generated client in pnpm's virtual store, so
# copy the dependency tree produced by the builder instead of assuming a
# node_modules/.prisma directory exists.
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 10000

CMD ["node", "dist/main.js"]
