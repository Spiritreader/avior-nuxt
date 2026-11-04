<template>
  <div>
    Accuracy
    <v-btn variant="text" icon color="primary" @click="expand = !expand">
      <v-icon>mdi-help-circle-outline</v-icon>
    </v-btn>
    <v-expand-transition>
      <v-card v-show="expand" class="mx-1 mb-2">
        <div>
          <p class="px-4 pt-4 mb-2 pb-0">
            Determines how strict the comparison is when the audio format of a duplicate differs.
            This only affects the decision, not how the format is detected.
          </p>
          <p class="px-4 mb-2 pb-0">
            Detection checks, in order: an unambiguous tuner log tag, the audio format timeline of the
            recorder log (the format that applies for the largest part of the recording), and finally
            ffprobe over the first 60 seconds when the logs leave it uncertain.
          </p>
          <v-list>
            <v-list-item>
              <template #prepend>
                <v-icon class="pr-0 mr-1">mdi-circle-small</v-icon>
              </template>
              low &mdash; any detected multichannel, even an uncertain one, beats any stereo
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon class="pr-0 mr-1">mdi-circle-small</v-icon>
              </template>
              med &mdash; likely or certain multichannel beats likely or certain stereo; uncertain values decide nothing
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon class="pr-0 mr-1">mdi-circle-small</v-icon>
              </template>
              high &mdash; only a certain multichannel beats a certain stereo
            </v-list-item>
          </v-list>
        </div>
      </v-card>
    </v-expand-transition>
    <!--
      mb-4: this slider's tick labels (low/med/high) hang below its track, and the only
      thing that used to keep them off the card's bottom edge was the validation-message
      slot Vuetify reserves under every input. hideDetails: 'auto' collapses that, so the
      labels ended up flush against the card. Sliders that carry an append text field do
      not need this — the field supplies the height.
    -->
    <v-slider
      v-model="selectedFormat"
      :ticks="stepTicks"
      :max="2"
      show-ticks="always"
      tick-size="4"
      step="1"
      color="red-darken-3"
      class="mb-4"
    >
      <template v-slot:thumb-label="props">
        <v-icon>{{ accIcon(props.modelValue) }}</v-icon>
      </template>
    </v-slider>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import type { AudioSettings as AudioSettingsType, ModuleName, ModuleSettingsUpdate } from "@/types";

const props = defineProps<{
  settings: AudioSettingsType;
  name: ModuleName;
}>();

const emit = defineEmits<{
  newdata: [update: ModuleSettingsUpdate];
}>();

const expand = ref(false);
// This component really does have a selectedFormat -- its watcher is live.
const selectedFormat = ref(0);
// Same object reference as the prop, deliberately not a copy.
const settingsInternal = ref<AudioSettingsType>(props.settings);
const steps = ref<string[]>(["low", "med", "high"]);

function accIcon(value: any) {
  if (value == 0) {
    return "mdi-circle-outline";
  } else if (value == 1) {
    return "mdi-circle-slice-4";
  } else if (value == 2) {
    return "mdi-circle-slice-8";
  }
}

const stepTicks = computed<Record<number, string>>(() => {
  return steps.value.reduce<Record<number, string>>((acc, label, index) => {
    acc[index] = label;
    return acc;
  }, {});
});

onMounted(() => {
  selectedFormat.value = steps.value.indexOf(settingsInternal.value.Accuracy);
});

watch(selectedFormat, () => {
  const value = selectedFormat.value;
  settingsInternal.value.Accuracy = steps.value[value];
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
