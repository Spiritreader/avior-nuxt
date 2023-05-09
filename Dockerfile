FROM node:20.1.0-alpine

ARG COMMIT=""
LABEL commit=${COMMIT}

RUN mkdir -p /app
WORKDIR /app

# Install software
COPY . /app

ENV NUXT_ENV_CURRENT_GIT_SHA=${COMMIT}

RUN npm install
RUN npm run build
EXPOSE 10009
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=10009
CMD [ "npm", "start" ]
