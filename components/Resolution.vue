<template>
  <v-card flat class="d-flex">
    <v-col>
      <v-text-field
        label="Tag"
        v-model="field.tag"
        placeholder="Enter Resolution Tag"
        hide-details
        outlined
      ></v-text-field>
    </v-col>
    <v-col>
      <v-text-field
        label="Resolution"
        v-model="field.resolution"
        placeholder="Enter Resolution Tag"
        hide-details
        outlined
      ></v-text-field>
    </v-col>
  </v-card>
</template>

<script>
export default {
  methods: {},
  mounted() {
    this.field.tag = this.tag;
    this.field.resolution = this.resolution;
    console.log(this.field.tag);
    console.log(this.field.resolution);
  },
  data: () => ({
    field: {
      tag: "",
      resolution: ""
    },
  }),
  props: {
    tag: String,
    resolution: String,
  },
  watch: {
    resolution: {
      handler: function () {
        this.$emit("newdata", this.field);
      },
      deep: true,
    },
  },
};
</script>