<template>
  <v-layout column justify-center align-center>
    <v-flex xs12 sm8 md6>
      <div class="text-center">hnmm</div>
      <v-card>
        <v-card-title class="headline">Welcome to the Vuetify + Nuxt.js template</v-card-title>
        <v-card-text>herro</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" nuxt to="/config">Continue</v-btn>
        </v-card-actions>
      </v-card>
      <client v:client="asdf"></client>
    </v-flex>
  </v-layout>
</template>

<script>
export default {
  data() {
    return {
      client: {
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
          Slice: 5,
          OfSlices: 10,
          Remaining: 0,
          Progress: 10,
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
        Paused: true,
        ShutdownPending: false,
      },
    };
  },
  async asyncData(context) {},
};
</script>
