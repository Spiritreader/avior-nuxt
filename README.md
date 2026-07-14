# Avior Frontend

Frontend for displaying data polled from the avior-go project.

## What is it?

Avior features full configuration and monitoring for an avior-go instance.
For documentation on avior-go, please confer the
[avior-go repository](https://www.github.com/Spiritreader/avior-go)

## Registering Clients

Go to frontend settings and add a client name and the address of the avior-go instance.
avior-go is only designed to work with a private network, as there is no authentication needed to update its configuration and start/stop it.
An instance is reachable via `http://network-ip:10000`.

You can also add multiple clients with the same name and a different IP, for example:
- Phoenix: `http://10.10.10.1:10000`
- Phoenix: `http://172.31.0.246:10000`

The best available route will be automatically selected. This enabled you to expose avior-go via your own private VPN.

## General Usage
### Overview
You can start, pause and stop clients and view its log files

### Client settings
You can configure all available options there. Documentation is available in avior-go. These settings are individual to each client

### Global settings:

You can add and remove clients that are eligible for receiving jobs here.
**Clients**
- Priority determines which client will be filled wit jobs first, up to the maximum. After that, the next client will be chosen for new jobs
- Start and end time configure during which times a client can *encode files*. It does not influence the assignment rules
- Can always receive jobs determines if a client can receive jobs even when it is offline.

**Include/Exclude lists**

This is a global configuration instance for the LogMatch module and the trimming feature of avior-go.

## Stack

- [Vue 3](https://vuejs.org/) + TypeScript, `<script setup>` throughout
- [Vuetify 4](https://vuetifyjs.com/) for UI components (Material Design 3)
- [Vite](https://vitejs.dev/) for dev server and bundling
- [vue-router](https://router.vuejs.org/), file-based via `unplugin-vue-router` (routes are just files under `src/pages`)
- [Express 5](https://expressjs.com/) + [Mongoose 9](https://mongoosejs.com/) for the API and MongoDB access

## Architecture

This is a single-page app with no server-side rendering. Express serves two
things on the same port: the built static SPA (`dist/`) and the `/api` routes.

There are two independent data paths:
- **Browser → `/api` → Express → MongoDB.** This is the client registry
  (which avior-go instances exist, their names/addresses/priorities/etc). App
  code always calls `/api/...` with a relative path — no base URL is
  configured anywhere, in dev or in production.
- **Browser → avior-go daemons, directly.** Once the client registry gives
  the browser a daemon's LAN address, the browser talks to that daemon
  directly (e.g. `http://network-ip:10000`) to start/stop jobs, stream logs,
  etc. Express is never in this path, and nothing proxies it.

## Development

```bash
pnpm install

pnpm dev:api   # Express API on :10009
pnpm dev       # Vite dev server, normally :5173
```

Vite proxies `/api/*` requests to `http://localhost:10009` in dev, so the
app-origin `/api` calls work the same way they do in production. If port
5173 is already taken, Vite will pick the next free port and print which one
it used.

## Production

```bash
pnpm build          # builds the SPA into dist/
node server/index.js   # or: pnpm start
```

Express serves the built `dist/` and `/api` together on a single `PORT`
(default `10009`).

## Configuration

Environment variables:
- `MONGO_URL` — MongoDB connection string. Defaults to
  `mongodb://192.168.178.75:27017/Avior`. There is no `config.json` file or
  volume mount for this anymore — set the environment variable instead.
- `PORT` — port Express listens on. Defaults to `10009`.

`VITE_COMMIT_SHA` is inlined into the app **at build time** by Vite (it shows
up in the footer). Setting it as a runtime environment variable on an
already-built `dist/` has no effect — it must be set when `pnpm build` runs.

## Requirements

- Node >= 20.19 (required by Mongoose 9)
- [pnpm](https://pnpm.io/) — this project uses pnpm exclusively; do not use
  `npm install` or `yarn`.

## Linting

```bash
pnpm lint
```

ESLint flat config (`eslint.config.js`) covering `src/**/*.{ts,vue}` (Vue 3 +
TypeScript), `server/**/*.js` (CommonJS Node), and `scripts/*.mjs` (Node ESM).

## Docker

This project is also available on dockerhub. Pass your database URL as an
environment variable:

```docker
docker run --publish=10009:10009 --env MONGO_URL=mongodb://your-url/Avior spiritreader/avior-nuxt
```
