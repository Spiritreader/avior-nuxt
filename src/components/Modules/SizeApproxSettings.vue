<template>
  <div>
    <div>
      File Size Difference %
      <v-btn variant="text" icon color="primary" @click="expand = !expand">
        <v-icon>mdi-help-circle-outline</v-icon>
      </v-btn>
      <v-expand-transition>
        <v-card v-show="expand" class="mx-1 mb-2">
          <div>
            <p class="px-4 pt-4 mb-0 pb-4">
              If the estimated file size is {{ settingsInternal.Difference }}% smaller than the duplicate, a file is eligible for
              replacement
            </p>
          </div>
        </v-card>
      </v-expand-transition>
      <v-slider
        color="red-darken-3"
        v-model="settingsInternal.Difference"
        class="align-center"
        :max="max"
        :min="min"
        hide-details
      >
        <template v-slot:append>
          <v-text-field
            v-model="settingsInternal.Difference"
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
    <div>
      Fraction %
      <v-btn variant="text" icon color="primary" @click="expand2 = !expand2">
        <v-icon>mdi-help-circle-outline</v-icon>
      </v-btn>
      <v-expand-transition>
        <v-card v-show="expand2" class="mx-1 mb-2">
          <div>
            <p class="px-4 pt-4 mb-0 pb-4">
              How much of the new file should be encoded for the estimation. More is better, but takes more
              <v-icon class="pr-1">mdi-clock-time-four-outline</v-icon>to process
            </p>
          </div>
        </v-card>
      </v-expand-transition>
      <v-slider color="red-darken-3" v-model="settingsInternal.Fraction" class="align-center" :max="max" :min="min" hide-details>
        <template v-slot:append>
          <v-text-field
            v-model="settingsInternal.Fraction"
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
    <div>
      <div class="mt-4 d-flex align-center">
        <v-text-field
          label="Sample Count"
          type="number"
          min="0"
          v-model.number="settingsInternal.SampleCount"
          placeholder="Days"
          hide-details
          variant="outlined"
        ></v-text-field>
        <v-btn variant="text" icon class="ml-2" style="width: 60px" color="primary" @click="expand3 = !expand3">
          <v-icon>mdi-help-circle-outline</v-icon>
        </v-btn>
      </div>
      <v-expand-transition>
        <v-card v-show="expand3" class="mx-1 mt-4 mb-2">
          <div>
            <p class="px-4 pt-4 pb-3">
              This sets the amount of slices that are encoded. More slices generally mean a more uniform representation of the
              estimated bitrate, but if the configured fraction is too small, approximation may become inaccurate.
            </p>
          </div>
        </v-card>
      </v-expand-transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import type { ModuleName, ModuleSettingsUpdate, SizeApproxSettings as SizeApproxSettingsType } from "@/types";

const props = defineProps<{
  settings: SizeApproxSettingsType;
  name: ModuleName;
}>();

const emit = defineEmits<{
  newdata: [update: ModuleSettingsUpdate];
}>();

const min = ref(0);
const max = ref(100);
const expand = ref(false);
const expand2 = ref(false);
const expand3 = ref(false);
// Same object reference as the prop, deliberately not a copy.
const settingsInternal = ref<SizeApproxSettingsType>(props.settings);

onMounted(() => {});

/**
 * NOT deep -- exactly like the Options API original, which declared this watcher
 * without `deep: true`. It therefore fires only if settingsInternal is reassigned,
 * which never happens; editing its fields leaves it silent. Kept as-is.
 */
watch(settingsInternal, () => {
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
