<template>
  <v-card color="#242424" class="pl-1 mx-2 mb-4">
    <!--
      Vuetify 4's v-card-title is `display: block` with nowrap/ellipsis, where Vuetify 2's
      was a flex row. Without d-flex the v-spacer does nothing and the switch drops onto
      its own line below the module name. The original also zeroed the top padding
      (`pt-0`), which in Vuetify 2 was masked by the switch's own margins — in Vuetify 4 it
      just glues the title to the top of the card, so the default padding stays.
    -->
    <v-card-title class="d-flex align-center">
      <span>{{ name }}</span>
      <v-spacer></v-spacer>
      <v-switch
        color="red-darken-3"
        :label="moduleInternal.Enabled ? ' Enabled' : ' Disabled'"
        v-model="moduleInternal.Enabled"
        hide-details
        density="compact"
        class="flex-grow-0"
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
    <!--
      Vuetify 4 has no `text-overline`; MD3's nearest label style is text-label-medium,
      but it is not uppercase and has no tracking. `text-uppercase` restores the overline
      look with Vuetify 4's own utilities.
    -->
    <v-container v-if="moduleInternal.Settings" class="text-label-medium text-uppercase pb-0 mb-0">Settings</v-container>
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
  // Shares the prop's object, so v-model edits below write straight through to it.
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
