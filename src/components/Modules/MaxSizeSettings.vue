<template>
  <div>
    <div class="d-flex">
      <v-text-field
        label="Maximum Size"
        type="number"
        min="0"
        v-model.number="settingsInternal.MaxSize"
        placeholder="GB"
        hide-details
        variant="outlined"
      ></v-text-field>
      <v-btn icon class="mb-2 ml-2 mt-3" color="primary" @click="expand = !expand">
        <v-icon>mdi-help-circle-outline</v-icon>
      </v-btn>
    </div>
    <v-expand-transition>
      <v-card v-show="expand" class="mx-1 mb-2 mt-4">
        <p class="px-4 pt-4 pb-3">
          Maximum unencoded allowed file size in Gigabytes. Files beyond this threshold will be ignored
        </p>
      </v-card>
    </v-expand-transition>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import type { MaxSizeSettings as MaxSizeSettingsType, ModuleName, ModuleSettingsUpdate } from "@/types";

const props = defineProps<{
  settings: MaxSizeSettingsType;
  name: ModuleName;
}>();

const emit = defineEmits<{
  newdata: [update: ModuleSettingsUpdate];
}>();

const expand = ref(false);
// Same object reference as the prop, deliberately not a copy.
const settingsInternal = ref<MaxSizeSettingsType>(props.settings);

onMounted(() => {});

/**
 * DEAD WATCHER -- preserved from the original.
 * The Options API version watched `selectedFormat`, which this component never
 * declared, so the handler never ran and "newdata" was never emitted. Nothing
 * writes this ref, so it stays just as dead.
 */
const selectedFormat = ref(0);
watch(selectedFormat, () => {
  emit("newdata", {
    Name: props.name,
    Settings: settingsInternal.value,
  });
});
</script>

<style>
.priority-tb {
  max-width: 120px;
}
.maxout {
  width: 100%;
}
</style>
