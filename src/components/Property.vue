<template>
  <div class="d-flex">
    <div v-if="allowNew" class="d-flex align-center justify-center">
      <v-btn @click="editTag()" icon class="ml-2">
        <v-icon v-if="disabledTag">mdi-circle-edit-outline</v-icon>
        <v-icon color="green" v-else>mdi-checkbox-marked-circle-outline</v-icon>
      </v-btn>
    </div>
    <v-container>
      <v-row>
        <v-col class="py-2" xs="6" sm="4" md="3" lg="2" xl="2">
          <v-text-field
            :disabled="disabledTag"
            label="Tag"
            v-model="tagInternal"
            :placeholder="`Enter ${tagName}`"
            hide-details
            variant="outlined"
          ></v-text-field>
        </v-col>
        <v-col class="py-2 pr-1" xs="6" sm="8" md="9" lg="10" xl="10">
          <v-text-field
            label="Resolution"
            v-model="contentInternal"
            :placeholder="`Enter ${contentName}`"
            hide-details
            variant="outlined"
          ></v-text-field>
        </v-col>
      </v-row>
    </v-container>
    <div v-if="allowNew" class="d-flex align-center justify-center pr-2">
      <v-btn icon color="red" @click="remove()">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

const props = defineProps<{
  allowNew?: boolean;
  new?: boolean;
  id: number;
  tag: string;
  content: string;
  tagName?: string;
  contentName?: string;
}>();

const emit = defineEmits<{
  newtagdata: [payload: { tag: string; id: number }];
  newcontentdata: [payload: { tag: string; content: string }];
  deleted: [tag: string];
}>();

const disabledTag = ref(true);
const tagInternal = ref("");
const contentInternal = ref("");
const deleted = ref(false);

function remove() {
  deleted.value = true;
}

function editTag() {
  if (!disabledTag.value) {
    emit("newtagdata", { tag: tagInternal.value, id: props.id });
    disabledTag.value = true;
  } else {
    disabledTag.value = false;
  }
}

onMounted(() => {
  tagInternal.value = props.tag;
  contentInternal.value = props.content;
  if (props.new) {
    disabledTag.value = false;
  }
});

watch(deleted, () => {
  emit("deleted", props.tag);
});

watch(contentInternal, () => {
  emit("newcontentdata", {
    tag: props.tag,
    content: contentInternal.value,
  });
});
</script>
