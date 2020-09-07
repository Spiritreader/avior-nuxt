<template>
  <v-layout column justify-center align-center>
    <v-flex xs12 sm8 md6>
      <v-row v-if="$fetchState.pending" class="mb-6 mt-10" justify="center" no-gutters>
        <v-progress-circular :size="150" :width="80" color="red darken-3" indeterminate></v-progress-circular>
      </v-row>
      <v-row v-else-if="$fetchState.error" class="mb-6" justify="start" no-gutters>
        <p>There was something I couldn't load.</p>
      </v-row>
      <Client v-else v-for="client in clients" :key="client.Name" :client="client"></Client>
    </v-flex>
    <v-btn @click="getClients">refresh</v-btn>
  </v-layout>
</template>

<script>
export default {
  created() {
    this.timer = setInterval(this.getClients, 2000);
  },
  beforeDestroy() {
    clearInterval(this.timer);
  },
  async fetch() {
    console.log("fetching");
    await this.getClients();
  },
  data() {
    return {
      timer: null,
      clients: [],
    };
  },
  methods: {
    getIpAddresses: async function () {
      let clientInfos = await fetch("api/clients").then(res => res.json());
      const clients = [];
      for (const client of clientInfos) {
        clients.push({ ip: client.Address, HostName: client.Name });
      }
      //console.log(clients);
      return clients;
    },
    getClients: async function () {
      const promises = [];
      const clients = await this.getIpAddresses();
      for (const client of clients) {
        try {
          const clientInfo = await fetch(client.ip).then(res => res.json());
          const idx = this.clients.findIndex((c) => c.HostName.toLowerCase() === clientInfo.HostName.toLowerCase());
          let temp = this.clients;
          if (idx !== -1) {
            this.clients.splice(idx, 1, clientInfo);
          } else {
            this.clients.push(clientInfo);
          }
        } catch (err) {
          const idx = this.clients.findIndex((c) => c.HostName.toLowerCase() === client.HostName.toLowerCase());
          let temp = this.clients;
          if (idx == -1) {
            this.clients.push({HostName: client.HostName, Status: "offline", Encoder: {
              OfSlices: 0,
              Slice: 0,
              Progress: 0
            }});
          } else {
            this.clients.splice(idx, 1,{HostName: client.HostName, Status: "offline", Encoder: {
              OfSlices: 0,
              Slice: 0,
              Progress: 0
            }});
          }
          //console.log(`client ${client.name} is not online! ${err}`);
        }
      }
    },
  },
};
</script>
