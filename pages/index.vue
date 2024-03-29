<template>
  <div>
    <!--
    <div v-if="!$fetchState.error && totalLoadedLeft > 0 && !noSkeleton">
      <v-skeleton-loader v-for="n in totalLoadedLeft" :key="n" type="image" class="ma-2"></v-skeleton-loader>
    </div>
    <div v-else-if="$fetchState.pending">
      <v-row v-if="$fetchState.pending" class="mb-6 mt-10" justify="center" no-gutters>
        <v-progress-circular :size="150" :width="20" color="yellow darken-3" indeterminate></v-progress-circular>
      </v-row>
    </div>-->
    <v-row v-if="$fetchState.error" class="mb-6" justify="start" no-gutters>
      <p>There was something I couldn't load.</p>
    </v-row>
    <Client v-for="client in clientInfosOnline" :key="client.HostName" @offlineClient="moveClientToOfflineList" :clientInit="client"></Client>
    <Client v-for="client in clientInfosOffline" :key="client.HostName + '_offline'" :clientInit="client"></Client>
    <div v-if="totalLoadedLeft > 0">
      <v-skeleton-loader v-for="n in totalLoadedLeft" :key="n" type="image" class="ma-2"></v-skeleton-loader>
    </div>
    <v-row class="d-flex pt-3 pb-2 justify-center">
      <v-btn v-if="!$fetchState.error" :disabled="$fetchState.pending" class="mx-2">
        <v-icon class="custom-loader" v-if="!refreshing">mdi-cached</v-icon>
        <v-icon v-else>mdi-cached</v-icon>
      </v-btn>
      <v-btn v-if="!$fetchState.pending" :disabled="refreshing" @click="pingOffline">Ping Offline</v-btn>
    </v-row>
  </div>
</template>

<script>
import any from "promise.any";

export default {
  inject: ["theme"],
  async fetch() {
    console.log("fetching");
    this.tryResolveClients();
  },
  fetchOnServer: false,
  data() {
    return {
      refreshing: false,
      init: true,
      noSkeleton: false,
      totalLoadedLeft: -1,
      refreshBtn: "Enable Auto-Refresh",
      ws: null,
      clientInfosOnline: [],
      clientInfosOffline: [],
    };
  },
  methods: {
    /**
     * Moves client from online to offline list when their websocket connection is closed or terminated
     */
    moveClientToOfflineList(offlineClient) {
      console.log(`moving ${offlineClient.HostName} to offline list`);
      let idx = this.clientInfosOnline.findIndex((cio) => cio.HostName.toLowerCase() == offlineClient.HostName.toLowerCase());
      if (idx != -1) {
        this.clientInfosOnline.splice(idx, 1);
        this.clientInfosOffline.push(offlineClient);
      }
    },
    /**
     * Whenever the resolvedClient datapoint is updated by tryResolveClients,
     * it will be either pre-filled and added to the clientInfosOnline array
     * before the update loop, or added to the clientInfosOffline array if unreachable
     */
    async processClient(resolvedClient) {
      console.log(resolvedClient.HostName);
      if (resolvedClient.Reachable) {
        await this.fillClientInfoArrays(resolvedClient);
      } else {
        const idx = this.clientInfosOffline.findIndex((cio) => cio.HostName.toLowerCase() == resolvedClient.HostName.toLowerCase());
        if (idx == -1) {
          this.clientInfosOffline.push({
            HostName: resolvedClient.HostName,
            Ip: resolvedClient.Address,
            Status: "offline",
          });
        } else {
          this.$set(this.clientInfosOffline[idx], "Refreshing", false);
        }
      }
      if (this.init) {
        this.totalLoadedLeft--;
      }

      if (this.totalLoadedLeft == 0) {
        this.init = false;
      }
    },
    /**
     * Fills the clientInfosOnline and clientInfosOffline array
     * Initializes data for all clients in the Online list
     * If a client was previously offline, it will be moved to the offlien list
     * If a client is not reachable during this operation, it will be put into the offline list
     */
    async fillClientInfoArrays(client) {
      try {
        // IDX
        // check if object already exists in the online list. If so, don't update it.
        // Subsequent updating should be handled automatically by clients themselves
        const idx = this.clientInfosOnline.findIndex((cio) => cio.HostName.toLowerCase() == client.HostName.toLowerCase());

        // IDY
        // check if object already existss in the offline list.
        // If so, mark for removal from the offline list
        const idy = this.clientInfosOffline.findIndex((cio) => cio.HostName.toLowerCase() == client.HostName.toLowerCase());

        // execute IDX
        // update initially
        if (idx == -1) {
          const clientInfo = await this.fetchClientData(client);
          this.clientInfosOnline.push(clientInfo);
        }

        // execute IDY
        if (idy != -1) {
          this.clientInfosOffline.splice(idy, 1);
        }
      } catch (err) {
        // In case a client goes offline just after being verified as reachable
        console.log(err);

        // check if object already existss in the offline list.
        // If not, add it.
        const idy = this.clientInfosOffline.findIndex((cio) => cio.HostName.toLowerCase() == client.HostName.toLowerCase());
        if (idy == -1) {
          this.clientInfosOffline.push({
            HostName: client.HostName,
            Ip: client.Address,
            Status: "offline",
            Refreshing: false,
          });
        } else {
          this.$set(this.clientInfosOffline[idy], "Refreshing", false);
        }
      }
    },
    /**
     * Fetches all client metadata given the provided client Address
     */
    async fetchClientData(client) {
      const clientInfo = await this.$http.$get(client.Address);
      clientInfo.Ip = client.Address;
      clientInfo.HostName = client.HostName;
      clientInfo.EncoderLineOut = await this.$http.$get(client.Address + "/encoder/");
      clientInfo.Refreshing = false;
      return clientInfo;
    },
    /**
     * Tries to resolve the first available IP address from all clients returned by the api.
     * @returns a resolved client object with a HostName, Address and Reachable property.
     * The address provided when Reachable is false is not a correct resolve!
     */
    tryResolveClients: async function () {
      const unresolvedClients = await this.$http.$get("api/clients");
      if (this.init) {
        this.totalLoadedLeft = unresolvedClients.length;
      }
      for (let client of unresolvedClients) {
        this.resolveAsync(client);
      }
    },
    /**
     * Determine which address response first for any given client
     * with a promise race
     */
    resolveAsync: async function (client) {
      let promises = [];
      for (let address of client.Addresses) {
        try {
          let promise = new Promise(async (resolve, reject) => {
            let response;
            try {
              response = await this.$http.$get(address + "/alive");
            } catch (err) {
              reject({ address: "none", response: {} });
              return;
            }
            resolve({ address: address, response: response });
          });
          promises.push(promise);
        } catch (error) {
          console.log(`$failed to create promises: ${error}`);
        }
      }
      let resolution;
      const resolvedClient = {
        HostName: client.Name,
      };
      try {
        any.shim(); // shimmy shim shim
        resolution = await Promise.any(promises);
        resolvedClient.Reachable = true;
        resolvedClient.Address = resolution.address;
      } catch {
        resolvedClient.Reachable = false;
        resolvedClient.Address = client.Addresses[0];
      }
      //await this.connectToWebSocket(resolvedClient);
      await this.processClient(resolvedClient);
    },
    pingOffline: async function () {
      this.refreshing = true;
      this.clientInfosOffline.forEach((client) => this.$set(client, "Refreshing", true));
      this.tryResolveClients();
      setTimeout(() => {
        this.refreshing = false;
      }, 1000);
    },
  },
};
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
