<template>
  <div>
    <div class="d-flex">
      <v-text-field
        label="Maximum Age"
        type="number"
        min="0"
        v-model.number="settingsInternal.MaxAge"
        placeholder="Days"
        hide-details
        variant="outlined"
      ></v-text-field>
      <v-btn icon class="mb-2 ml-2 mt-3" color="primary" @click="expand = !expand">
        <v-icon>mdi-help-circle-outline</v-icon>
      </v-btn>
    </div>
    <v-expand-transition>
      <v-card v-show="expand" class="mx-1 mb-2 mt-4">
        <div>
          <p class="px-4 pt-4 pb-3">Maximum duplicate file age in days before it is no longer protected from replacement</p>
        </div>
      </v-card>
    </v-expand-transition>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import type { AgeSettings as AgeSettingsType, ModuleName, ModuleSettingsUpdate } from "@/types";

const props = defineProps<{
  settings: AgeSettingsType;
  name: ModuleName;
}>();

const emit = defineEmits<{
  newdata: [update: ModuleSettingsUpdate];
}>();

const expand = ref(false);
// Same object reference as the prop, deliberately not a copy.
const settingsInternal = ref<AgeSettingsType>(props.settings);

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
