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

    <v-divider class="my-4"></v-divider>
    <div class="text-subtitle-2 mb-1">Shortfall tolerance by planned runtime</div>
    <p class="text-body-2 mb-2">
      A recording may run up to <em>minutes</em> short of its planned runtime when the film is
      shorter than <em>below minutes</em>. Sender EPG durations include commercial breaks, so this
      replaces the comparison against the existing file. A row without <em>below minutes</em> is the
      catch-all for longer films.
    </p>
    <v-row v-for="(step, idx) in tolerances" :key="idx" dense align="center" class="mx-0">
      <v-col cols="5" class="py-1">
        <v-text-field
          v-model.number="step.below_minutes"
          label="below minutes"
          type="number"
          variant="outlined"
          density="compact"
          hide-details
          placeholder="catch-all"
          clearable
        ></v-text-field>
      </v-col>
      <v-col cols="5" class="py-1">
        <v-text-field
          v-model.number="step.minutes"
          label="minutes"
          type="number"
          variant="outlined"
          density="compact"
          hide-details
        ></v-text-field>
      </v-col>
      <v-col cols="2" class="py-1">
        <v-btn icon variant="text" color="red-lighten-2" @click="removeStep(idx)">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </v-col>
    </v-row>
    <v-btn variant="outlined" color="orange-lighten-2" class="mt-2" @click="addStep">
      <v-icon class="mr-2">mdi-plus</v-icon>Add step
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { DuplicateLengthCheckSettings as DuplicateLengthCheckSettingsType, ModuleName, ModuleSettingsUpdate, ToleranceStep } from "@/types";

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

/** Editable rows; below_minutes stays undefined for the catch-all row. */
const tolerances = ref<ToleranceStep[]>(
  (props.settings.Tolerances ?? []).map((step) => ({
    below_minutes: step.below_minutes,
    minutes: step.minutes,
  })),
);

function emitTolerances() {
  settingsInternal.value.Tolerances = tolerances.value.map((step) => ({
    below_minutes: step.below_minutes ? Number(step.below_minutes) : undefined,
    minutes: Number(step.minutes) || 0,
  }));
  emit("newdata", {
    Name: props.name,
    Settings: settingsInternal.value,
  });
}

function addStep() {
  tolerances.value.push({ minutes: 0 });
  emitTolerances();
}

function removeStep(idx: number) {
  tolerances.value.splice(idx, 1);
  emitTolerances();
}

watch(tolerances, emitTolerances, { deep: true });
</script>

<style>
.priority-tb {
  max-width: 120px;
}
.maxout {
  width: 100%;
}
</style>
