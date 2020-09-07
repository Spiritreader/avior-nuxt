<template>
  <v-container>
    <v-row v-if="$fetchState.pending" class="mb-6 mt-10" justify="center" no-gutters>
      <v-progress-circular :size="150" :width="80" color="red darken-3" indeterminate></v-progress-circular>
    </v-row>
    <v-row v-else-if="$fetchState.error" class="mb-6" justify="start" no-gutters>
      <p>There was something I couldn't load.</p>
    </v-row>
    <Client v-else v-for="client in clients" :key="client.Name" :client="client"></Client>
    <v-btn @click="getClients">refresh</v-btn>
  </v-container>
</template>

<script>
export default {
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
            Active: false,
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
              "D:\\Recording\\FilmMittwoch im Ersten  Schönes Schlamassel_2020-09-03-00-23-00-Das Erste HD (AC3,deu).ts",
          },
          FileWalker: {
            Active: true,
            Directory:
              "D:\\Recording\\FilmMittwoch im Ersten  Schönes Schlamassel_2020-09-03-00-23-00-Das Erste HD (AC3,deu).ts",
            Position: 45340,
            LibSize: 1521120,
          },
          Mover: {
            Active: false,
            File:
              "D:\\Recording\\FilmMittwoch im Ersten  Schönes Schlamassel_2020-09-03-00-23-00-Das Erste HD (AC3,deu).ts",
            Progress: 15,
            Position: "1235",
            FileSize: "544245",
          },
          Paused: false,
          ShutdownPending: false,
          Ip: "http://10.10.13.0",
        },
        {
          HostName: "DESKTOP-KN",
          Encoder: {
            Active: false,
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
              "D:\\Recording\\FilmMittwoch im Ersten  Schönes Schlamassel_2020-09-03-00-23-00-Das Erste HD (AC3,deu).ts",
          },
          FileWalker: {
            Active: false,
            Directory:
              "D:\\Recording\\FilmMittwoch im Ersten  Schönes Schlamassel_2020-09-03-00-23-00-Das Erste HD (AC3,deu).ts",
            Position: 1121120,
            LibSize: 1521120,
          },
          Mover: {
            Active: true,
            File:
              "D:\\Recording\\FilmMittwoch im Ersten  Schönes Schlamassel_2020-09-03-00-23-00-Das Erste HD (AC3,deu).ts",
            Progress: 95,
            Position: "544245",
            FileSize: "544245",
          },
          Paused: false,
          ShutdownPending: false,
          Ip: "http://10.10.12.0",
        },
        {
          HostName: "ASDF",
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
            Slice: 7,
            OfSlices: 10,
            Remaining: 152002120000,
            Progress: 68,
            ReplacementReason: "",
            OutPath: "D:\\Recording\\Fi.ts",
          },
          FileWalker: {
            Active: false,
            Directory:
              "D:\\Recording\\FilmMittwoch im Ersten  Schönes Schlamassel_2020-09-03-00-23-00-Das Erste HD (AC3,deu).ts",
            Position: 45340,
            LibSize: 1521120,
          },
          Mover: {
            Active: false,
            File:
              "D:\\Recording\\FilmMittwoch im Ersten  Schönes Schlamassel_2020-09-03-00-23-00-Das Erste HD (AC3,deu).ts",
            Progress: 15,
            Position: "1235",
            FileSize: "544245",
          },
          Paused: false,
          ShutdownPending: false,
          Ip: "http://10.10.11.0",
        },
        {
          HostName: "#WF",
          Status: "offline",
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
        clients.unshift({ ip: client.Address, HostName: client.Name });
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
          clientInfo.Ip = client.ip;
          const idx = this.clients.findIndex(
            (c) =>
              c.HostName.toLowerCase() === clientInfo.HostName.toLowerCase()
          );
          let temp = this.clients;
          if (idx !== -1) {
            this.clients.splice(idx, 1, clientInfo);
          } else {
            this.clients.unshift(clientInfo);
          }
        } catch (err) {
          const idx = this.clients.findIndex(
            (c) => c.HostName.toLowerCase() === client.HostName.toLowerCase()
          );
          let temp = this.clients;
          if (idx == -1) {
            this.clients.unshift({
              HostName: client.HostName,
              Status: "offline",
            });
          } else {
            this.clients.splice(idx, 1, {
              HostName: client.HostName,
              Status: "offline",
            });
          }
          //console.log(`client ${client.name} is not online! ${err}`);
        }
      }
    },
  },
};
</script>
