<template>
  <div>
    Length Difference %
    <v-btn variant="text" icon color="primary" @click="expand = !expand">
      <v-icon>mdi-help-circle-outline</v-icon>
    </v-btn>
    <v-expand-transition>
      <v-card v-show="expand" class="mx-1 mb-2">
        <div class="px-4 pt-4 mb-0 pb-1">
          <p>This setting configures how much the duplicate file and the replacement file are allowed to differ in length</p>
          <p class="pb-0 mb-1">
            Setting the threshold to a value greater than 0 allows the new file to be {{ settingsInternal.threshold }}% shorter
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
import type { DuplicateLengthCheckSettings as DuplicateLengthCheckSettingsType, ModuleName, ModuleSettingsUpdate } from "@/types";

/**
 * The template interpolates `settingsInternal.threshold` (lower-case t), which
 * the daemon never sends -- it renders empty. Kept as-is; the optional member
 * only exists so the template still type-checks.
 */
type DuplicateLengthCheckInternal = DuplicateLengthCheckSettingsType & { threshold?: number };

const props = defineProps<{
  settings: DuplicateLengthCheckSettingsType;
  name: ModuleName;
}>();

const emit = defineEmits<{
  newdata: [update: ModuleSettingsUpdate];
}>();

const min = ref(0);
const max = ref(20);
const expand = ref(false);
const threshold = ref(props.settings.Threshold);
// Same object reference as the prop, deliberately not a copy.
const settingsInternal = ref<DuplicateLengthCheckInternal>(props.settings);

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
