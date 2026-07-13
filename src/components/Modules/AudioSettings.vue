<template>
  <div>
    Accuracy
    <v-btn variant="text" icon color="primary" @click="expand = !expand">
      <v-icon>mdi-help-circle-outline</v-icon>
    </v-btn>
    <v-expand-transition>
      <v-card v-show="expand" class="mx-1 mb-2">
        <div>
          <p class="px-4 pt-4 mb-0 pb-0">
            Determines how lenient or strict the encoder should be with the audio format detection.
          </p>
          <v-list>
            <v-list-item>
              <template #prepend>
                <v-icon class="pr-0 mr-1">mdi-circle-small</v-icon>
              </template>
              low will detect audio if tuner log includes a reference
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon class="pr-0 mr-1">mdi-circle-small</v-icon>
              </template>
              med will detect audio if tuner log includes a reference and the metadata log has a tag
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon class="pr-0 mr-1">mdi-circle-small</v-icon>
              </template>
              high will detect audio if tuner log exclusively lists it
            </v-list-item>
          </v-list>
        </div>
      </v-card>
    </v-expand-transition>
    <v-slider v-model="selectedFormat" :ticks="stepTicks" :max="2" show-ticks="always" tick-size="4" step="1" color="red-darken-3">
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
