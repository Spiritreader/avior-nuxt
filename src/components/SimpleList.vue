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

<script setup lang="ts">
import { ref, watch } from "vue";

defineOptions({ name: "SimpleList" });

const props = withDefaults(
  defineProps<{
    list: string[];
    icon?: string;
    type?: string;
    noheader?: boolean;
  }>(),
  { noheader: false }
);

const emit = defineEmits<{
  newdata: [list: string[]];
}>();

const newElement = ref("");

// NOTE: mutates the prop's array in place -- the parent owns the array, this
// child edits it. Preserved from the Options API original on purpose.
function addElement() {
  if (newElement.value.length > 0) {
    props.list.push(newElement.value);
    newElement.value = "";
  }
}

function removeElement(index: number) {
  props.list.splice(index, 1);
}

watch(
  () => props.list,
  () => {
    emit("newdata", props.list);
  },
  { deep: true }
);
</script>
