<template>
  <div>
    <!--
      align-center: this row is a flex container, so it defaults to align-items: stretch.
      The help button's mt-3/mb-2 margins make it taller than the 56px field, so the field
      was stretched to match it — the value sat at the top of an over-tall box with dead
      space beneath, which read as a leftover validation slot. Vuetify 2 hid this because
      its field reserved a message slot and so was TALLER than the button; collapsing that
      slot exposed the mismatch. Centring the row removes the stretch, and the button no
      longer needs vertical margins to fake its position.
    -->
    <div class="d-flex align-center">
      <v-text-field
        label="Threshold"
        type="number"
        min="0"
        v-model.number="settingsInternal.Threshold"
        placeholder="Errors"
        hide-details
        variant="outlined"
      ></v-text-field>
      <v-btn variant="text" icon class="ml-2" color="primary" @click="expand = !expand">
        <v-icon>mdi-help-circle-outline</v-icon>
      </v-btn>
    </div>
    <v-expand-transition>
      <v-card v-show="expand" class="mx-1 mb-2 mt-4">
        <div>
          <p class="px-4 pt-4">
            The minimum amount of errors the duplicate file is allowed to have before errors are matched with the new file.
          </p>
          <p class="px-4 pb-3">
            Once the threshold is crossed, if the new file has less errors, it will be considered eligible for replacement.
          </p>
        </div>
      </v-card>
    </v-expand-transition>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import type { ErrorReplaceSettings as ErrorReplaceSettingsType, ModuleName, ModuleSettingsUpdate } from "@/types";

const props = defineProps<{
  settings: ErrorReplaceSettingsType;
  name: ModuleName;
}>();

const emit = defineEmits<{
  newdata: [update: ModuleSettingsUpdate];
}>();

const expand = ref(false);
// Same object reference as the prop, deliberately not a copy.
const settingsInternal = ref<ErrorReplaceSettingsType>(props.settings);

onMounted(() => {});

/**
 * DEAD WATCHER -- preserved from the original.
 * The Options API version watched `selectedFormat`, which this component never
 * declared, so the handler never ran and "newdata" was never emitted. Nothing
 * writes this ref, so it stays just as dead.
 */
const selectedFormat = ref(0);
watch(selectedFormat, () => {
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
