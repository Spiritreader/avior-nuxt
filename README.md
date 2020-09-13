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

### Global settings: You can add and remove clients that are eligible for receiving jobs here. 

**Clients**
- Priority determines which client will be filled wit jobs first, up to the maximum. After that, the next client will be chosen for new jobs
- Start and end time configure during which times a client can *encode files*. It does not influence the assignment rules
- Can always receive jobs determines if a client can receive jobs even when it is offline.

**Include/Exclude lists**

This is a global configuration instance for the LogMatch module and the trimming feature of avior-go.


## Installation

### Building manually

```bash
$ npm install
$ npm run dev

$ npm run build
$ npm run start
```

For detailed explanation on how things work, check out [Nuxt.js docs](https://nuxtjs.org).

Modify the config.json file and change the URL to your mongodb instance.

### Docker

This project is also available on dockerhub. Make sure to map a database configuration by creating a `config.json` like so:
```json
{
    "url": "mongodb://your-url"
}
```

Then run the docker container:

```docker
docker run --publish=10009:10009--volume=/<path-to-config>/config.json:app/api/config.json spiritreader/avior-nuxt
```