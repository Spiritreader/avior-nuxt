<template>
  <div>
    Length Difference %
    <v-btn icon color="primary" @click="expand = !expand">
      <v-icon>mdi-help-circle-outline</v-icon>
    </v-btn>
    <v-expand-transition>
      <v-card v-show="expand" class="mx-1 mb-2">
        <div>
          <p class="px-4 pt-4 mb-0 pb-4">
            This setting configures how much difference in the recorded length vs the broadcasted length of a video file is
            allowed.
          </p>
        </div>
      </v-card>
    </v-expand-transition>
    <v-slider color="red-darken-3" v-model="threshold" class="align-center" :max="max" :min="min" hide-details>
      <template v-slot:append>
        <v-text-field
          v-model="threshold"
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
import { ref, watch } from "vue";
import type { LengthSettings as LengthSettingsType, ModuleName, ModuleSettingsUpdate } from "@/types";

const props = defineProps<{
  settings: LengthSettingsType;
  name: ModuleName;
}>();

const emit = defineEmits<{
  newdata: [update: ModuleSettingsUpdate];
}>();

const min = ref(0);
const max = ref(100);
const expand = ref(false);
const threshold = ref(props.settings.Threshold);
// Same object reference as the prop, deliberately not a copy.
const settingsInternal = ref<LengthSettingsType>(props.settings);

watch(threshold, () => {
  settingsInternal.value.Threshold = threshold.value;
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
