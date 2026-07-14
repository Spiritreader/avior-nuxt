FROM node:24-alpine AS build

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.12.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# `COPY . .` pulls in .git (not excluded by .dockerignore) so the commit SHA can
# be resolved at build time with no build-arg and no git binary. Keep .git out of
# .dockerignore for this to work.
COPY . .

# Vite inlines import.meta.env at build time, so VITE_COMMIT_SHA must be set for
# `pnpm build`, not at runtime. Resolve the short SHA from .git metadata:
#   HEAD holds either a raw SHA (detached checkout, e.g. Komodo) or "ref: <path>";
#   for a ref, read .git/<path>, falling back to packed-refs.
# An explicit COMMIT build-arg still wins if a builder chooses to pass one.
ARG COMMIT=""
RUN GIT_HEAD="$(cat .git/HEAD 2>/dev/null || true)"; \
    if [ -n "$COMMIT" ]; then \
      HASH="$COMMIT"; \
    elif echo "$GIT_HEAD" | grep -q '^ref: '; then \
      REF="$(echo "$GIT_HEAD" | sed 's/^ref: //')"; \
      if [ -f ".git/$REF" ]; then \
        HASH="$(cat ".git/$REF")"; \
      elif [ -f ".git/packed-refs" ]; then \
        HASH="$(grep " $REF\$" .git/packed-refs | head -1 | cut -d' ' -f1)"; \
      fi; \
    else \
      HASH="$GIT_HEAD"; \
    fi; \
    export VITE_COMMIT_SHA="$(echo "${HASH:-unknown}" | cut -c1-7)"; \
    echo "Building SPA with commit: $VITE_COMMIT_SHA"; \
    pnpm build

FROM node:24-alpine AS runtime

# org.opencontainers.image.source links the package to its repo so GHCR files it
# under the right project (and inherits the repo's visibility/README). This is a
# static value; the actual commit is baked into the SPA (VITE_COMMIT_SHA, shown
# in the UI) and Komodo also tags each image with the commit hash.
LABEL org.opencontainers.image.source=https://github.com/Spiritreader/avior-nuxt
LABEL org.opencontainers.image.description="Avior frontend — Vite + Vue 3 + Vuetify 4 SPA with an Express API"

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
