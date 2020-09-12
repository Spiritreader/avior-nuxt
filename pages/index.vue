<template>
  <div>
    <v-row v-if="!$fetchState.pending" class="d-flex justify-center">
      <v-btn @click="autoRefresh">
        <v-icon class="custom-loader" v-if="timer">mdi-cached</v-icon>
        <v-icon v-else>mdi-cached</v-icon>
      </v-btn>
    </v-row>
    <div v-if="!$fetchState.error && totalLoadedLeft > 0 && !timer">
      <v-skeleton-loader v-for="n in totalLoadedLeft" :key="n" type="image" class="ma-2"></v-skeleton-loader>
    </div>
    <div v-else-if="$fetchState.pending">
      <v-row v-if="$fetchState.pending" class="mb-6 mt-10" justify="center" no-gutters>
        <v-progress-circular :size="150" :width="20" color="yellow darken-3" indeterminate></v-progress-circular>
      </v-row>
    </div>
    <v-row v-else-if="$fetchState.error" class="mb-6" justify="start" no-gutters>
      <p>There was something I couldn't load.</p>
    </v-row>
    <Client v-for="client in clients" :key="client.Name" :client="client"></Client>
  </div>
</template>

<script>
export default {
  inject: ["theme"],
  beforeDestroy() {
    clearInterval(this.timer);
    clearInterval(this.debugTimer);
  },
  mounted() {
    /*if (process.client) {
      if (this.debugTimer == null) {
        this.debugTimer = setInterval(() => {
          let yidx = this.clients.findIndex((c) => c.HostName == "ASDF");
          if (this.clients[yidx].Encoder.Progress > 90) {
            this.clients[yidx].Encoder.Progress = 0;
          } else {
            this.clients[yidx].Encoder.Progress += 5;
          }
        }, 1000);
      }
    }*/
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.refreshBtn = "Enable Auto-Refresh";
    } else if (process.client) {
      this.timer = setInterval(this.getClients, 2000);
      this.refreshBtn = "Disable Auto-Refresh";
    }
  },
  async fetch() {
    console.log("fetching");
    await this.getClients();
  },
  data() {
    return {
      debugTimer: null,
      totalLoadedLeft: 0,
      refreshBtn: "Enable Auto-Refresh",
      timer: null,
      clients: [/*{          HostName: "Blabla",
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
            Directory: "D:\\Recording\\Fil",
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
          InFile: "sadf",
        },
        {
          HostName: "DESKTOP-KN",
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
            Slice: 6,
            OfSlices: 10,
            Remaining: 152002120000,
            Progress: 10,
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
            Active: false,
            File:
              "D:\\Recording\\FilmMittwoch im Ersten  Schönes Schlamassel_2020-09-03-00-23-00-Das Erste HD (AC3,deu).ts",
            Progress: 95,
            Position: "544245",
            FileSize: "544245",
          },
          Paused: false,
          ShutdownPending: false,
          Ip: "http://10.10.12.0",
          InFile: "sadf",
        },*/
        /*
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
            Slice: 6,
            OfSlices: 10,
            Remaining: 152002120000,
            Progress: 10,
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
          EncoderLineOut: [
            1,
            2,
            3,
            4,
            5,
            6,
            77,
            98,
            8,
            6,
            6,
            34,
            243,
            132,
            234,
            423,
            243,
            24,
            24,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            3,
            "D:\\Recording\\FilmMittwoch im Ersten  Schönes Schlamassel_2020-09-03-00-23-00-Das Erste HD (AC3,deu).tsD:\\Recording\\FilmMittwoch im Ersten  Schönes Schlamassel_2020-09-03-00-23-00-Das Erste HD (AC3,deu).tsD:\\Recording\\FilmMittwoch im Ersten  Schönes Schlamassel_2020-09-03-00-23-00-Das Erste HD (AC3,deu).ts",
            23,
          ],
          InFile: "sadf",
        },
        {
          HostName: "#WF",
          Status: "offline",
        },*/
      ],
    };
  },
  methods: {
    autoRefresh() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
        this.refreshBtn = "Enable Auto-Refresh";
      } else if (process.client) {
        this.timer = setInterval(this.getClients, 2000);
        this.refreshBtn = "Disable Auto-Refresh";
      }
    },
    getIpAddresses: async function () {
      const clientInfos = await this.$http.$get("api/clients");
      const clients = [];
      for (const client of clientInfos) {
        clients.unshift({ ip: client.Address, HostName: client.Name });
      }
      this.totalLoadedLeft = clients.length;
      return clients;
    },
    getClients: async function () {
      const promises = [];
      const clients = await this.getIpAddresses();
      for (const client of clients) {
        try {
          const clientInfo = await this.$http.$get(client.ip);
          clientInfo.Ip = client.ip;
          clientInfo.EncoderLineOut = await this.$http.$get(
            client.ip + "/encoder"
          );
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
          console.log(err);
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
        }
        if (this.totalLoadedLeft > 0) {
          this.totalLoadedLeft--;
        }
      }
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