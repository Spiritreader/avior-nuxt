<template>
  <div>
    Resolution Difference %
    <v-btn variant="text" icon color="primary" @click="expand = !expand">
      <v-icon>mdi-help-circle-outline</v-icon>
    </v-btn>
    <v-expand-transition>
      <v-card v-show="expand" class="mx-1 mb-2">
        <div>
          <p class="px-4 pt-4 mb-0 pb-4">
            This setting configures how large the difference between two files' resolutions in percent is allowed. This goes both
            ways. The new file is eligible if the resolution is {{ minResolution }}% higher, but will be rejected if it's
            {{ minResolution }}% lower.
          </p>
        </div>
      </v-card>
    </v-expand-transition>
    <v-slider color="red-darken-3" v-model="minResolution" class="align-center" :max="max" :min="min" hide-details>
      <template v-slot:append>
        <v-text-field
          v-model="minResolution"
          class="mt-0 pt-0"
          hide-details
          single-line
          type="number"
          style="width: 60px"
        ></v-text-field>
      </template>
      <template v-slot:thumb-label>
        <v-icon>mdi-percent</v-icon>
      </template>
    </v-slider>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import type { ModuleName, ModuleSettingsUpdate, ResolutionSettings as ResolutionSettingsType } from "@/types";

const props = defineProps<{
  settings: ResolutionSettingsType;
  name: ModuleName;
}>();

const emit = defineEmits<{
  newdata: [update: ModuleSettingsUpdate];
}>();

const min = ref(0);
const max = ref(100);
const expand = ref(false);
const minResolution = ref(0);
// Same object reference as the prop, deliberately not a copy.
const settingsInternal = ref<ResolutionSettingsType>(props.settings);

onMounted(() => {
  minResolution.value = settingsInternal.value.MinResolution;
});

watch(minResolution, () => {
  settingsInternal.value.MinResolution = minResolution.value;
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
