<template>
  <!--
    The Vuetify 2 original wrapped the rows in a <v-list-item-group
    v-model="selectedMediaPath">, but that tag was ALREADY COMMENTED OUT in the
    source and `selectedMediaPath` was never declared, bound, or emitted. The
    selection state was dead, so it is not reproduced here. `flat` is gone too:
    VList has no such prop in Vuetify 4 (it existed in v2 only to suppress the
    active-item highlight, which without an item group never appeared anyway).
  -->
  <v-list>
    <v-list-subheader v-if="!noheader">{{ type }}s</v-list-subheader>

    <v-list-item v-for="(item, i) in list" :key="i">
      <template #prepend>
        <v-icon>{{ icon }}</v-icon>
      </template>
      <v-list-item-title>{{ item }}</v-list-item-title>
      <template #append>
        <v-btn icon size="small" variant="text" color="red" @click="removeElement(i)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-list-item>

    <v-list-item key="add">
      <template #prepend>
        <a class="mr-5" @click="addElement">
          <v-icon>mdi-plus</v-icon>
        </a>
      </template>
      <v-list-item-title>
        <v-text-field
          v-model="newElement"
          :label="`Add ${type}`"
          variant="solo"
          flat
          density="compact"
          hide-details
          class="ma-0 pa-0"
          @keydown.enter="addElement"
        ></v-text-field>
      </v-list-item-title>
    </v-list-item>
  </v-list>
</template>

<script>
export default {
  name: "SimpleList",
  props: {
    list: Array,
    icon: String,
    type: String,
    noheader: Boolean,
  },
  emits: ["newdata"],
  data: () => ({
    newElement: "",
  }),
  methods: {
    addElement() {
      if (this.newElement.length > 0) {
        this.list.push(this.newElement);
        this.newElement = "";
      }
    },
    removeElement(index) {
      this.list.splice(index, 1);
    },
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
