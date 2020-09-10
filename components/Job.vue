<template v-slot:default="{ active }">
div
  <v-list-item-action>
    <v-checkbox :input-value="active" multiple v-model="selectedJobs" :value="job" color="primary"></v-checkbox>
  </v-list-item-action>

  <v-list-item-content>
    <v-list-item-title class="text-wrap" v-text="getJobName(job)"></v-list-item-title>
    <v-list-item-subtitle class="text-wrap">{{ job.Path }}</v-list-item-subtitle>
  </v-list-item-content>
  <v-list-item-action></v-list-item-action>
</template>