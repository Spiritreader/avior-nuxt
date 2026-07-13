FROM node:24-alpine AS build

# Vite inlines import.meta.env at build time, so the commit SHA has to be
# present in the build stage — setting it at runtime would have no effect.
ARG COMMIT=""
ENV VITE_COMMIT_SHA=${COMMIT}

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.12.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:24-alpine AS runtime

ARG COMMIT=""
LABEL commit=${COMMIT}

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.12.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY server ./server
COPY --from=build /app/dist ./dist

# NODE_ENV=production is load-bearing: without it Express uses its development
# error handler, which puts stack traces with absolute filesystem paths into
# HTTP response bodies.
ENV NODE_ENV=production
ENV PORT=10009
ENV MONGO_URL=mongodb://192.168.178.75:27017/Avior
EXPOSE 10009

CMD ["node", "server/index.js"]
