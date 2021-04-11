<template>
  <v-list flat>
    <v-subheader v-if="!noheader">{{ type }}s</v-subheader>
    <!-- <v-list-item-group v-model="selectedMediaPath" color="primary">-->
    <v-list-item v-for="(item, i) in list" :key="i">
      <v-list-item-icon>
        <v-icon>{{ icon }}</v-icon>
      </v-list-item-icon>
      <v-list-item-content>
        <v-list-item-title v-text="item"></v-list-item-title>
      </v-list-item-content>
      <v-btn icon small color="red" @click="removeElement(i)" class="mt-0"><v-icon>mdi-close</v-icon></v-btn>
    </v-list-item>
    <v-list-item :key="list + 1">
      <v-list-item-icon @click="addElement" class="mr-5">
        <a>
          <v-icon>mdi-plus</v-icon>
        </a>
      </v-list-item-icon>
      <v-list-item-content class="ma-0 pa-0">
        <v-list-item-title>
          <v-text-field
            :label="`Add ${type}`"
            v-model="newElement"
            v-on:keydown.enter="addElement"
            hide-details
            dense
            flat
            solo
            class="ma-0 pa-0"
          ></v-text-field>
        </v-list-item-title>
      </v-list-item-content>
    </v-list-item>
    <!-- </v-list-item-group> -->
  </v-list>
</template>

<script>
export default {
  methods: {
    addElement(event) {
      if (this.newElement.length > 0) {
        console.log(this.newElement);
        this.list.push(this.newElement);
        this.newElement = "";
      }
    },
    removeElement(index) {
      this.list.splice(index, 1);
    },
  },
  data: () => ({
    newElement: "",
  }),
  props: {
    list: Array,
    icon: String,
    type: String,
    noheader: Boolean,
  },
  watch: {
    list: {
      handler: function () {
        this.$emit("newdata", this.list);
      },
      deep: true,
    },
  },
};
</script>