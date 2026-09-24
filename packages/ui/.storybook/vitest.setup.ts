import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from "@storybook/vue3-vite";
import * as projectAnnotations from "./preview";

// Истории в Vitest получают те же декораторы/параметры, что и в Storybook (в т.ч. axe)
setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);
