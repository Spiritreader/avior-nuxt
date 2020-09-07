<template>
  <v-layout column justify-center align-center>
    <v-flex xs12 sm8 md6>
      <Client v-for="client in clients" :key="client.Name" :client="client"></Client>
    </v-flex>
  </v-layout>
</template>

<script>
export default {
  mounted() {},
  data() {
    return {
      clients: [
        /*{
          Name: "Phoenix",
          Encoder: {
            Active: false,
            Duration: "0001-01-01T01:32:00Z",
            Frame: 0,
            Fps: 0,
            Q: 0,
            Size: "",
            Position: "0001-01-01T00:00:00Z",
            Bitrate: "",
            Dup: 0,
            Drop: 0,
            Speed: 0,
            Slice: 10,
            OfSlices: 10,
            Remaining: 0,
            Progress: 100,
            ReplacementReason: "",
            OutPath: "",
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
        {
          Name: "VAVA",
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
            Remaining: 0,
            Progress: 39,
            ReplacementReason: "",
            OutPath: "",
          },
          FileWalker: {
            Active: false,
            Directory: "",
            Position: 0,
            LibSize: 0,
          },
          Mover: {
            Active: true,
            File: "",
            Progress: 0,
            Position: "",
            FileSize: "",
          },
          Paused: false,
          ShutdownPending: false,
        },
        {
          Name: "VDR",
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
            Slice: 0,
            OfSlices: 0,
            Remaining: 0,
            Progress: 0,
            ReplacementReason: "",
            OutPath: "",
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
        },*/
      ],
    };
  },
  methods: {
    getIpAddresses: async function () {
      let clientInfos = await this.$axios.$get("/api/clients");
      const ip = [];
      for (client of clientInfos) {
        this.ip.push(client.Address);
      }
      return ip;
    },
    getClients: async function () {
      const clients = [];
      const ipArray = await this.getIpAddresses();
      for (ip of ipArray) {
        
        clients.push()
      }
      this.clients = await this.$axios.$get("/api/clients");
    },
  },
};
</script>
