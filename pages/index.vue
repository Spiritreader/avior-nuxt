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
    //this.timer = setInterval(this.getClients, 2000);
  },
  beforeDestroy() {
    clearInterval(this.timer);
  },
  mounted() {
    if (process.client) {
      this.timer = setInterval(this.getClients, 2000);
    }
  },
  async fetch() {
    console.log("fetching");
    await this.getClients();
  },
  data() {
    return {
      timer: null,
      clients: [
        {
          HostName: "VAVA",
          Encoder: {
            Active: true,
            Duration: "0001-01-01T00:00:00Z",
            Frame: 0,
            Fps: 0,
            Q: 0,
            Size: "",
            Position: "0001-01-01T00:00:00Z",
            Bitrate: "",
            Dup: 0,
            Drop: 0,
            Speed: 0,
            Slice: 2,
            OfSlices: 10,
            Remaining: 152002120,
            Progress: 39,
            ReplacementReason: "",
            OutPath:
              "ReplacementReasonReplacementReasonRepl acementReasonReplacementReasonReplacem entReasonReplacementReasonReplacementReasonR",
          },
          FileWalker: {
            Active: false,
            Directory: "",
            Position: 0,
            LibSize: 0,
          },
          Mover: {
            Active: false,
            File: "",
            Progress: 0,
            Position: "",
            FileSize: "",
          },
          Paused: false,
          ShutdownPending: false,
        },
      ],
    };
  },
  methods: {
    getIpAddresses: async function () {
      //const response = await fetch("http://localhost:3000/api/clients");
      //const clientInfos = await response.json();
      const clientInfos = await this.$http.$get("api/clients");
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
          //const response = await fetch(client.ip);
          //const clientInfo = await response.json();
          const clientInfo = await this.$http.$get(client.ip);
          const idx = this.clients.findIndex(
            (c) =>
              c.HostName.toLowerCase() === clientInfo.HostName.toLowerCase()
          );
          let temp = this.clients;
          if (idx !== -1) {
            this.clients.splice(idx, 1, clientInfo);
          } else {
            this.clients.push(clientInfo);
          }
        } catch (err) {
          const idx = this.clients.findIndex(
            (c) => c.HostName.toLowerCase() === client.HostName.toLowerCase()
          );
          let temp = this.clients;
          if (idx == -1) {
            this.clients.push({
              HostName: client.HostName,
              Status: "offline",
              Encoder: {
                OfSlices: 0,
                Slice: 0,
                Progress: 0,
              },
            });
          } else {
            this.clients.splice(idx, 1, {
              HostName: client.HostName,
              Status: "offline",
              Encoder: {
                OfSlices: 0,
                Slice: 0,
                Progress: 0,
              },
            });
          }
          //console.log(`client ${client.name} is not online! ${err}`);
        }
      }
    },
  },
};
</script>
