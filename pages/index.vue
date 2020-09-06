<template>
  <v-layout
    column
    justify-center
    align-center
  >
    <v-flex
      xs12
      sm8
      md6
    >
      <div class="text-center">
        hnmm
      </div>
      <v-card>
        <v-card-title class="headline">
          Welcome to the Vuetify + Nuxt.js template
        </v-card-title>
        <v-card-text>
         herro
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            nuxt
            to="/config"
          >
            Continue
          </v-btn>
        </v-card-actions>
      </v-card>
      <client
            v:name="'Phoenix'"
            :fps=34
            :status="'Idle'"
            :remaining=250
            :progress=500
            :bitrate="'10 kbps'"
            :replacementReason="'something'"
            :outPath="'/path'"
            :slice=2
          ></client>
    </v-flex>
  </v-layout>
</template>

<script>

export default {
  components: { 
  }
}
</script>
