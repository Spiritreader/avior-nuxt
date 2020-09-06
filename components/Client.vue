<template>
  <v-card class="mx-auto" max-width="344">
      <div>{{client}}asdasd</div>
    <!-- <v-card-text>
      <div>{{client}}</div>
      <p class="display-1 text--primary">{{client.Encoder.Name}}</p>
      <p
        v-bind:class="{ 'display-1': client.Encoder.Status != 'Idle' && client.Encoder.Status != 'Paused', 'text--primary': !!client.Encoder.Name }"
      >Status: {{client.Encoder.Status}}</p>
      <div class="text--primary">{{ totalProgress }}</div>
      <v-progress-circular
        :rotate="-90"
        :size="100"
        :width="15"
        :value="totalProgress"
        color="primary"
      >{{ totalProgress }}</v-progress-circular>
    </v-card-text>
    <v-card-actions>
      <v-btn text color="deep-purple accent-4">Edit</v-btn>
      <v-btn icon @click="show = !show">
        <v-icon>{{ show ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
      </v-btn>
    </v-card-actions>
    <v-expand-transition>
      <div v-show="show">
        <v-divider></v-divider>

        <v-card-text>
          <v-list subheader three-line>
            <v-list-item>
              <v-list-item-content v-for="(value, key) in client.Encoder" :key="key">
                <v-list-item-title>{{ key }}</v-list-item-title>
                <v-list-item-subtitle>{{ value }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card-text>
      </div>
    </v-expand-transition>
    -->
  </v-card>
</template>
<script>
export default {
  computed: {
  },
  data() {
    return {
      show: false,
    };
  },
  methods: {
    /*totalProgress: function() {
      console.log(this.client);
      const client = this.client.Encoder;
      console.log("asdf");
      if (client.OfSlices == 0) {
        return client.Progress;
      }
      return ((client.Slice - 1 / client.OfSlices) + (client.Progress / 100 / client.OfSlices)) * 100;
    }*/
  },
  props: {
    client: String
  },
};
</script>