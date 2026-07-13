FROM node:24-alpine

ARG COMMIT=""
LABEL commit=${COMMIT}

RUN mkdir -p /app
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.12.0 --activate

COPY . /app

ENV NUXT_ENV_CURRENT_GIT_SHA=${COMMIT}
ENV MONGO_URL=mongodb://192.168.178.75:27017/Avior

RUN pnpm install --frozen-lockfile
RUN pnpm build
EXPOSE 10009
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=10009
CMD [ "pnpm", "start" ]
