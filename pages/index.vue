<template>
  <div>
    <v-row v-if="!$fetchState.error" class="d-flex justify-center">
      <v-btn @click="autoRefresh" :disabled="$fetchState.pending">
        <v-icon class="custom-loader" v-if="timer">mdi-cached</v-icon>
        <v-icon v-else>mdi-cached</v-icon>
      </v-btn>
    </v-row>
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
    <Client v-for="client in clientInfos" :key="client.Name" :client="client"></Client>
    <div v-if="$fetchState.pending && totalLoadedLeft > 0 && !noSkeleton">
      <v-skeleton-loader v-for="n in totalLoadedLeft" :key="n" type="image" class="ma-2"></v-skeleton-loader>
    </div>
    <div v-if="refreshing">
      <v-skeleton-loader v-for="n in totalLoadedLeft" :key="n" type="image" class="ma-2"></v-skeleton-loader>
    </div>

    <v-row v-if="!$fetchState.pending" class="d-flex justify-center">
      <v-btn @click="refreshIps">Ping Offline</v-btn>
    </v-row>
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
          let yidx = this.clientInfos.findIndex((c) => c.HostName == "ASDF");
          if (this.clientInfos[yidx].Encoder.Progress > 90) {
            this.clientInfos[yidx].Encoder.Progress = 0;
          } else {
            this.clientInfos[yidx].Encoder.Progress += 5;
          }
        }, 1000);
      }
    }*/
    /*
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.refreshBtn = "Enable Auto-Refresh";
    } else if (process.client) {
      setTimeout(() => {
        this.timer = setInterval(this.getClients, 2000);
        this.refreshBtn = "Disable Auto-Refresh";
      }, 5000);
    }*/
  },
  async fetch() {
    console.log("fetching");
    this.bestIps = await this.getBestIps();
    await this.getClients(this.bestIps);
    this.init = false;
    this.noSkeleton = true;
    this.autoRefresh();
  },
  fetchOnServer: false,
  data() {
    return {
      refreshing: false,
      bestIps: [],
      init: true,
      debugTimer: null,
      noSkeleton: false,
      totalLoadedLeft: 0,
      refreshBtn: "Enable Auto-Refresh",
      timer: null,
      clientInfos: [],
      //clients: this.testClients()
    };
  },
  methods: {
    async refreshIps() {
      const reloadCount = 0;
      this.refreshing = true;
      const reenableAutoRefresh = this.timer ? true : false;
      if (this.timer) {
        this.autoRefresh();
      }
      const offlineClients = [];
      this.clientInfos = this.clientInfos.filter((c) => {
        if (c.Status == "offline") {
          this.totalLoadedLeft++;
          console.log(c);
          offlineClients.push({ ip: c.Ip, HostName: c.HostName });
        } else {
          return c;
        }
      });
      if (reenableAutoRefresh) {
        await this.getClients(offlineClients);
        //this.autoRefresh(this.bestIps);
      } else {
        await this.getClients(offlineClients);
      }
    },
    async getBestIps() {
      const clients = await this.getIpAddresses();
      let grouped = [[clients[0]]];
      let lastSeenName = "";
      outer: for (let client of clients.slice(1)) {
        for (let subArray of grouped) {
          if (subArray[0].HostName == client.HostName) {
            subArray.push(client);
            continue outer;
          } else if (lastSeenName == client.HostName) {
            lastSeenName = client.HostName;
            continue outer;
          }
        }
        grouped.push([client]);
      }
      let bestClientIps = [];
      for (let clientGroup of grouped) {
        let promises = [];
        for (let client of clientGroup) {
          try {
            let promise = new Promise(async (resolve, reject) => {
              let response;
              try {
                response = await this.$http.$get(client.ip);
              } catch (err) {
                reject(client);
                return;
              }
              resolve(client);
            });
            promises.push(promise);
          } catch (error) {
            console.log(`$failed to create promises: ${error}`);
          }
        }
        try {
          let raceResult = await Promise.race(promises);
          bestClientIps.push(raceResult);
        } catch (err) {
          bestClientIps.push(err);
        }
      }
      return bestClientIps;
    },
    autoRefresh() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
        this.refreshBtn = "Enable Auto-Refresh";
      } else if (process.client) {
        setTimeout(() => {
          this.timer = setInterval(() => {
            this.getClients(this.bestIps);
          }, 2000);
          this.refreshBtn = "Disable Auto-Refresh";
        }, 1000);
      }
    },
    getIpAddresses: async function () {
      const clientIps = await this.$http.$get("api/clients");
      const clients = [];
      for (const client of clientIps) {
        clients.push({ ip: client.Address, HostName: client.Name });
      }
      if (this.init) {
        //enable when not using getbestips
        this.totalLoadedLeft = clients.length;
        this.init = false;
      }
      return clients;
    },
    getClients: async function (clients) {
      const promises = [];
      // enable when not using getbestips
      //const clients = await this.getIpAddresses();
      if (!this.refreshing) {
        this.totalLoadedLeft = clients.length;
      }
      for (const client of clients) {
        try {
          const clientInfo = await this.$http.$get(client.ip);
          clientInfo.Ip = client.ip;
          clientInfo.EncoderLineOut = await this.$http.$get(
            client.ip + "/encoder/"
          );
          const idx = this.clientInfos.findIndex(
            (c) =>
              c.HostName.toLowerCase() === clientInfo.HostName.toLowerCase()
          );
          // replace or unshift, online clients should show up on top
          let temp = this.clientInfos;
          if (idx !== -1) {
            this.clientInfos.splice(idx, 1, clientInfo);
          } else {
            this.clientInfos.unshift(clientInfo);
          }
        } catch (err) {
          // push clients once if they are offline. Replace them or push.
          const idx = this.clientInfos.findIndex(
            (c) => c.HostName.toLowerCase() === client.HostName.toLowerCase()
          );
          let temp = this.clientInfos;
          if (idx == -1) {
            this.clientInfos.push({
              HostName: client.HostName,
              Ip: client.ip,
              Status: "offline",
            });
          } else {
            this.clientInfos.splice(idx, 1, {
              HostName: client.HostName,
              Ip: client.ip,
              Status: "offline",
            });
          }
          this.bestIps = this.bestIps.filter(
            (c) => c.HostName != client.HostName
          );
        }
        if (this.totalLoadedLeft > 0) {
          this.totalLoadedLeft--;
        }
      }
      this.refreshing = false;
    },
    testClients() {
      return [
        {
          HostName: "Blabla",
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
        },
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
      ];
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