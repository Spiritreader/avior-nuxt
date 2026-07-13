<template>
  <v-card color="#242424" class="pl-1 mx-2 mb-4">
    <v-card-title class="mb-0 pb-0 pt-0">
      {{ name }}
      <v-spacer></v-spacer>
      <v-switch
        color="red-darken-3"
        :label="moduleInternal.Enabled ? ' Enabled' : ' Disabled'"
        v-model="moduleInternal.Enabled"
      ></v-switch>
    </v-card-title>
    <v-container>
      <v-text-field
        label="Priority"
        type="number"
        min="0"
        v-model.number="moduleInternal.Priority"
        placeholder="Enter Priority"
        hide-details
        variant="outlined"
      ></v-text-field>
    </v-container>
    <v-container v-if="moduleInternal.Settings" class="text-label-medium pb-0 mb-0">Settings</v-container>
    <v-container class="pt-2">
      <slot></slot>
    </v-container>
    <!--<v-container v-if="name == 'AudioModule'">
      <AudioSettings :settings="module.Settings"></AudioSettings>
    </v-container>-->
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { ModuleConfig } from "@/types";

/**
 * The initial value has no `Settings` key at all (the template's
 * `v-if="moduleInternal.Settings"` is therefore false until mounted() swaps in
 * the real module), so Settings has to be optional here.
 */
type ModuleInternal = Omit<ModuleConfig<unknown>, "Settings"> & { Settings?: unknown };

const props = defineProps<{
  module: ModuleConfig<unknown>;
  name: string;
}>();

// The event name is nonsense and nobody listens for it. Kept verbatim.
const emit = defineEmits<{
  "update:moduleInternal.Priority": [value: number];
}>();

const moduleInternal = ref<ModuleInternal>({
  Enabled: false,
  Priority: -1,
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const computedPriority = computed<number>({
  get() {
    return moduleInternal.value.Priority;
  },
  set(newVal) {
    emit("update:moduleInternal.Priority", newVal);
  },
});

onMounted(() => {
  // Same object reference as the prop, not a copy.
  moduleInternal.value = props.module;
  console.log("hi from " + props.name);
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
