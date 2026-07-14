<template>
  <div>
    <v-row v-if="fetchError" class="mb-6" justify="start" no-gutters>
      <p>There was something I couldn't load.</p>
    </v-row>
    <Client v-for="client in clientInfosOnline" :key="client.HostName" @offlineClient="moveClientToOfflineList" :clientInit="client"></Client>
    <Client v-for="client in clientInfosOffline" :key="client.HostName + '_offline'" :clientInit="client"></Client>
    <div v-if="totalLoadedLeft > 0">
      <v-skeleton-loader v-for="n in totalLoadedLeft" :key="n" type="image" class="ma-2"></v-skeleton-loader>
    </div>
    <v-row class="d-flex pt-3 pb-2 justify-center">
      <v-btn v-if="!fetchError" :disabled="loading" class="mx-2">
        <v-icon class="custom-loader" v-if="!refreshing">mdi-cached</v-icon>
        <v-icon v-else>mdi-cached</v-icon>
      </v-btn>
      <v-btn v-if="!loading" :disabled="refreshing" @click="pingOffline">Ping Offline</v-btn>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { get } from "@/api/http";
import Client from "@/components/Client.vue";
import { useClientResolution } from "@/composables/useClientResolution";
import type { ClientInfo, ResolvedClient } from "@/types";

const { fetchClients, resolveClient } = useClientResolution();

const loading = ref(false);
const fetchError = ref<unknown>(null);
const refreshing = ref(false);
const init = ref(true);
const totalLoadedLeft = ref(-1);
const clientInfosOnline = ref<ClientInfo[]>([]);
const clientInfosOffline = ref<ClientInfo[]>([]);

/**
 * An offline client is represented by a bare {HostName, Ip, Status} with no
 * Encoder/FileWalker/Mover at all. Client.vue relies on `Status` short-circuiting
 * every read of those, so this cast is the one place the unsoundness lives.
 * See the note on ClientInfo in @/types.
 */
function offlineInfo(hostName: string, ip: string, refreshing?: boolean): ClientInfo {
  const info: Record<string, unknown> = { HostName: hostName, Ip: ip, Status: "offline" };
  if (refreshing !== undefined) info.Refreshing = refreshing;
  return info as unknown as ClientInfo;
}

/**
 * Replaces Nuxt's async fetch() hook. Called from mounted().
 */
async function refresh() {
  loading.value = true;
  fetchError.value = null;
  try {
    await tryResolveClients();
  } catch (err) {
    fetchError.value = err;
  } finally {
    loading.value = false;
  }
}

/**
 * Moves client from online to offline list when their websocket connection is closed or terminated.
 *
 * LATENT BUG, PRESERVED: Client.vue emits `offlineClient` with a ClientInfo from its
 * websocket `onclose`, but with a bare HostName STRING from `onerror`. On the string
 * path `offlineClient.HostName` is undefined and `.toLowerCase()` below throws. The
 * cast reproduces that exactly rather than silently guarding it. Not reachable in the
 * current environment: only clients that came up ONLINE ever open a websocket, and the
 * two dead daemons never do.
 */
function moveClientToOfflineList(offlineClientOrName: ClientInfo | string) {
  const offlineClient = offlineClientOrName as ClientInfo;
  console.log(`moving ${offlineClient.HostName} to offline list`);
  const idx = clientInfosOnline.value.findIndex((cio) => cio.HostName.toLowerCase() == offlineClient.HostName.toLowerCase());
  if (idx != -1) {
    clientInfosOnline.value.splice(idx, 1);
    clientInfosOffline.value.push(offlineClient);
  }
}

/**
 * Whenever the resolvedClient datapoint is updated by tryResolveClients,
 * it will be either pre-filled and added to the clientInfosOnline array
 * before the update loop, or added to the clientInfosOffline array if unreachable
 */
async function processClient(resolvedClient: ResolvedClient) {
  console.log(resolvedClient.HostName);
  if (resolvedClient.Reachable) {
    await fillClientInfoArrays(resolvedClient);
  } else {
    const idx = clientInfosOffline.value.findIndex((cio) => cio.HostName.toLowerCase() == resolvedClient.HostName.toLowerCase());
    if (idx == -1) {
      clientInfosOffline.value.push(offlineInfo(resolvedClient.HostName, resolvedClient.Address));
    } else {
      clientInfosOffline.value[idx].Refreshing = false;
    }
  }
  if (init.value) {
    totalLoadedLeft.value--;
  }

  if (totalLoadedLeft.value == 0) {
    init.value = false;
  }
}

/**
 * Fills the clientInfosOnline and clientInfosOffline array
 * Initializes data for all clients in the Online list
 * If a client was previously offline, it will be moved to the offlien list
 * If a client is not reachable during this operation, it will be put into the offline list
 */
async function fillClientInfoArrays(client: ResolvedClient) {
  try {
    // IDX
    // check if object already exists in the online list. If so, don't update it.
    // Subsequent updating should be handled automatically by clients themselves
    const idx = clientInfosOnline.value.findIndex((cio) => cio.HostName.toLowerCase() == client.HostName.toLowerCase());

    // IDY
    // check if object already existss in the offline list.
    // If so, mark for removal from the offline list
    const idy = clientInfosOffline.value.findIndex((cio) => cio.HostName.toLowerCase() == client.HostName.toLowerCase());

    // execute IDX
    // update initially
    if (idx == -1) {
      const clientInfo = await fetchClientData(client);
      clientInfosOnline.value.push(clientInfo);
    }

    // execute IDY
    if (idy != -1) {
      clientInfosOffline.value.splice(idy, 1);
    }
  } catch (err) {
    // In case a client goes offline just after being verified as reachable
    console.log(err);

    // check if object already existss in the offline list.
    // If not, add it.
    const idy = clientInfosOffline.value.findIndex((cio) => cio.HostName.toLowerCase() == client.HostName.toLowerCase());
    if (idy == -1) {
      clientInfosOffline.value.push(offlineInfo(client.HostName, client.Address, false));
    } else {
      clientInfosOffline.value[idy].Refreshing = false;
    }
  }
}

/**
 * Fetches all client metadata given the provided client Address
 */
async function fetchClientData(client: ResolvedClient): Promise<ClientInfo> {
  const clientInfo = await get<ClientInfo>(client.Address);
  clientInfo.Ip = client.Address;
  clientInfo.HostName = client.HostName;
  clientInfo.EncoderLineOut = await get<string[]>(client.Address + "/encoder/");
  clientInfo.Refreshing = false;
  return clientInfo;
}

/**
 * Tries to resolve the first available IP address from all clients returned by the api.
 * The address provided when Reachable is false is not a correct resolve!
 */
async function tryResolveClients() {
  const unresolvedClients = await fetchClients();
  if (init.value) {
    totalLoadedLeft.value = unresolvedClients.length;
  }
  for (const client of unresolvedClients) {
    // Deliberately NOT awaited: every client races its own addresses concurrently
    // and its card appears as soon as it resolves.
    void resolveAsync(client);
  }
}

/**
 * Determine which address responds first for any given client with a promise race.
 */
async function resolveAsync(client: Parameters<typeof resolveClient>[0]) {
  const resolvedClient = await resolveClient(client);
  //await connectToWebSocket(resolvedClient);
  await processClient(resolvedClient);
}

async function pingOffline() {
  refreshing.value = true;
  clientInfosOffline.value.forEach((client) => (client.Refreshing = true));
  tryResolveClients();
  setTimeout(() => {
    refreshing.value = false;
  }, 1000);
}

onMounted(() => {
  refresh();
});
</script>

<style>
.custom-loader {
  animation: loader 3.5s infinite;
  display: flex;
}
@-moz-keyframes loader {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0);
  }
}
@-webkit-keyframes loader {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0);
  }
}
@-o-keyframes loader {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0);
  }
}
@keyframes loader {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0);
  }
}
</style>
