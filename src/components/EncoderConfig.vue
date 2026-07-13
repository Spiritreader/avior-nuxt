<template>
  <v-container>
    <div>
      <h4 v-if="!isNew()" class="ml-3 pb-2">Encoder Configuration</h4>
      <h4 v-else class="ml-3 pb-2">Enter new encoder configuration</h4>
    </div>
    <v-alert v-model="showSaveHint" color="yellow" class="mx-3 mt-1" closable variant="text" type="info">
      <div class="alert-text">To push changes to the client, you need to hit upload config</div>
    </v-alert>
    <!--
      A v-row, where the original had a bare `d-flex` div. Vuetify 2's .col-* carried
      `flex: 0 0 <n>%` on the class itself, so a column sized correctly inside any flex
      parent. Vuetify 4 computes a column's flex-basis from custom properties that
      .v-row declares, so with no row the calc is invalid and the column shrink-wraps —
      which collapsed the Tag field to the width of its own text.
    -->
    <v-row class="pb-1">
      <v-col cols="8" md="8" lg="5" xl="5" class="pr-0">
        <v-text-field
          :disabled="disabledTag"
          label="Tag"
          v-model="tagInternal"
          :placeholder="`Enter resolution tag`"
          hide-details
          variant="outlined"
        ></v-text-field>
      </v-col>
      <v-col>
        <v-btn variant="text" @click="editAll()" cols="4" md="4" lg="7" xl="7" icon class="mt-3">
          <v-icon v-if="disabledTag">mdi-circle-edit-outline</v-icon>
          <v-icon color="green" v-else>mdi-checkbox-marked-circle-outline</v-icon>
        </v-btn>
        <v-btn variant="text" v-if="allowNew" :disabled="isNew()" icon class="mt-3" @click="deleteConfirm = true">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </v-col>
    </v-row>
    <div class="px-3 pt-3 pb-4">
      <v-text-field
        :disabled="disabledTag"
        v-model="outDirectory"
        :placeholder="`Enter resolution tag`"
        hide-details
        variant="outlined"
      ></v-text-field>
    </div>
    <div class="px-3 pt-3">
      <v-textarea
        :disabled="disabledTag"
        variant="outlined"
        auto-grow
        placeholder="One command per line please :)"
        name="PreArgumentsInput"
        label="Pre-Arguments"
        v-model="preArgumentsString"
      ></v-textarea>
    </div>
    <div class="px-3">
      <v-textarea
        :disabled="disabledTag"
        variant="outlined"
        label="Post-Arguments"
        placeholder="One command per line please :)"
        auto-grow
        name="PostArgumentsInput"
        v-model="postArgumentsString"
      ></v-textarea>
    </div>
    <div class="px-3">
      <v-textarea
        :disabled="disabledTag"
        variant="outlined"
        label="Stereo Encoding Arguments"
        placeholder="Use this to specify an encoding profile for stereo audio streams.
If you don't specify a profile, only the post arguments will be used."
        auto-grow
        name="StereoInput"
        v-model="stereoArgumentsString"
      ></v-textarea>
    </div>
    <div class="px-3">
      <v-textarea
        :disabled="disabledTag"
        variant="outlined"
        label="Multi Channel Encoding Arguments"
        placeholder="Use this to specify an encoding profile for mutli channel audio streams.
If you don't specify a profile, only the post arguments will be used."
        auto-grow
        name="MultiChInput"
        v-model="multiChArgumentsString"
      ></v-textarea>
    </div>
    <div class="px-3">
      <v-textarea
        :disabled="disabledTag"
        variant="outlined"
        label="Stash"
        placeholder="Use this to store parameters you're currently not using :)"
        auto-grow
        name="StashInput"
        v-model="stashString"
      ></v-textarea>
    </div>
    <v-dialog v-if="deleteConfirm" v-model="deleteConfirm" max-width="500">
      <template v-slot:activator="{ props }">
        <v-btn variant="text" class="mb-2" size="44" icon color="red" v-bind="props">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
      <v-card>
        <v-card-title>Do you really want to delete the config for {{ tagInternal }}?</v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="darken-1" variant="text" @click="deleteConfirm = false">Cancel</v-btn>
          <v-btn
            color="red-darken-1"
            variant="text"
            @click="
              deleteConfirm = false;
              remove();
            "
            >Delete</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-container class="d-flex justify-center mt-0 pt-0"></v-container>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import type { EncoderConfigEntry } from "@/types";

const props = defineProps<{
  allowNew: boolean;
  // `new` is a reserved word, but a perfectly legal prop name.
  new: boolean;
  id: number;
  tag: string;
  content: Partial<EncoderConfigEntry>;
}>();

const emit = defineEmits<{
  (e: "newdata", payload: { tag: string; content: Partial<EncoderConfigEntry>; id: number }): void;
  (e: "deleted", tag: string): void;
  (e: "isEdit", disabledTag: boolean): void;
}>();

const showSaveHint = ref(false);
const deleteConfirm = ref(false);
const disabledTag = ref(true);
const tagInternal = ref("");
// May be undefined for the synthetic "New Template..." row, exactly as before.
const outDirectory = ref<string | undefined>("");
const preArgumentsString = ref("");
const postArgumentsString = ref("");
const stashString = ref("");
const stereoArgumentsString = ref("");
const multiChArgumentsString = ref("");
const deleted = ref(false);

function refresh() {
  if (!props.new) {
    disabledTag.value = true;
  } else {
    disabledTag.value = false;
  }
  preArgumentsString.value = "";
  postArgumentsString.value = "";
  stereoArgumentsString.value = "";
  multiChArgumentsString.value = "";
  stashString.value = "";
  console.log("mounted");
  console.log(props.content);
  tagInternal.value = props.tag;
  if (props.content.PreArguments) {
    props.content.PreArguments.forEach((l) => (preArgumentsString.value += l + "\n"));
  }

  if (props.content.PostArguments) {
    props.content.PostArguments.forEach((l) => (postArgumentsString.value += l + "\n"));
  }
  if (props.content.Stash) {
    props.content.Stash.forEach((l) => (stashString.value += l + "\n"));
  }
  if (props.content.StereoArguments) {
    props.content.StereoArguments.forEach((l) => (stereoArgumentsString.value += l + "\n"));
  }
  if (props.content.MultiChArguments) {
    props.content.MultiChArguments.forEach((l) => (multiChArgumentsString.value += l + "\n"));
  }
  outDirectory.value = props.content.OutDirectory;
  if (props.new) {
    disabledTag.value = false;
  }
}

function isNew() {
  return props.new;
}

function remove() {
  deleted.value = true;
}

function editAll() {
  if (!disabledTag.value) {
    // in case you're ever wondering what filter(e => e) does again and why it seems so pointless
    // it prevents empty lines from being added to the array
    // which would result in a lot of empty lines in the textareas
    // and cause issues with the encoding of files because ffmpeg REALLY DISLIKES empty lines
    props.content.PreArguments = preArgumentsString.value.trim().split("\n").filter(e => e).map(s => s.trim());
    props.content.PostArguments = postArgumentsString.value.trim().split("\n").filter(e => e).map(s => s.trim());
    props.content.MultiChArguments = multiChArgumentsString.value.trim().split("\n").filter(e => e).map(s => s.trim());
    props.content.StereoArguments = stereoArgumentsString.value.trim().split("\n").filter(e => e).map(s => s.trim());

    // NOTE: no `.filter(e => e)` here, unlike the four above. That asymmetry is
    // in the original and is preserved deliberately.
    props.content.Stash = stashString.value.trim().split("\n");
    props.content.OutDirectory = outDirectory.value;
    console.log(props.content.PreArguments);
    emit("newdata", {
      tag: tagInternal.value,
      content: props.content,
      id: props.id,
    });
    disabledTag.value = true;
    showSaveHint.value = true;
  } else {
    disabledTag.value = false;
  }
}

onMounted(() => {
  refresh();
});

watch(deleted, () => {
  emit("deleted", props.tag);
});

watch(
  () => props.id,
  () => {
    refresh();
  }
);

watch(disabledTag, () => {
  emit("isEdit", disabledTag.value);
});
</script>

<style>
.alert-text {
  margin-top: 2px;
}
</style>
