FROM node:20.1.0-alpine

ARG COMMIT=""
LABEL commit=${COMMIT}

RUN mkdir -p /app
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.12.0 --activate

COPY . /app

ENV NUXT_ENV_CURRENT_GIT_SHA=${COMMIT}
ENV MONGO_URL=mongodb://10.11.194.75/Avior

RUN pnpm install --frozen-lockfile
RUN pnpm build
EXPOSE 10009
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=10009
CMD [ "pnpm", "start" ]
