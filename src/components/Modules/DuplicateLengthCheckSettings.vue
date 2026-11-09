<template>
  <div>
    Shortfall tolerance by planned runtime
    <v-btn variant="text" icon color="primary" @click="expand = !expand">
      <v-icon>mdi-help-circle-outline</v-icon>
    </v-btn>
    <v-expand-transition>
      <v-card v-show="expand" class="mx-1 mb-2">
        <div class="px-4 pt-4 mb-0 pb-1">
          <p>
            The new recording is judged against its own planned runtime (EPG), not against the runtime
            of the existing file: sender EPG durations include commercial breaks and old recordings may
            have overrun, so a shorter but complete recording must still be allowed to replace them.
          </p>
          <p class="pb-0 mb-1">
            Each row allows a shortfall in <em>minutes</em> when the planned runtime is shorter than
            <em>below minutes</em>. A row without <em>below minutes</em> is the catch-all for longer
            films. Without a planned runtime the module skips instead of guessing.
          </p>
        </div>
      </v-card>
    </v-expand-transition>

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

const props = defineProps<{
  settings: DuplicateLengthCheckSettingsType;
  name: ModuleName;
}>();

const emit = defineEmits<{
  newdata: [update: ModuleSettingsUpdate];
}>();

const expand = ref(false);
// Same object reference as the prop, deliberately not a copy.
const settingsInternal = ref<DuplicateLengthCheckSettingsType>(props.settings);

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
