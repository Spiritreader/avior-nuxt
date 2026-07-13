# Avior Nuxt frontend
Frontend for displaying data polled from the avior-go project.

## What is it?
Avior Nuxt features full configuration and monitoring for an avior-go instance.
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


## Installation

### Building manually

Requires Node >= 20.19 and pnpm.

```bash
$ pnpm install

# development: Vite dev server on :5173, Express API on :10009
$ pnpm dev:api
$ pnpm dev

# production: build the SPA, then serve it and the API from Express on :10009
$ pnpm build
$ pnpm start
```

### Configuration

The MongoDB connection string is read from the `MONGO_URL` environment variable.
It defaults to `mongodb://192.168.178.75:27017/Avior`. There is no `config.json`;
set the environment variable instead.

The listening port is read from `PORT` and defaults to `10009`.

### Docker

This project is also available on dockerhub. Pass your database URL as an
environment variable:

```docker
docker run --publish=10009:10009 --env MONGO_URL=mongodb://your-url/Avior spiritreader/avior-nuxt
```
