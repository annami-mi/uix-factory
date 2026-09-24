import { addons } from "storybook/manager-api";
import { uixTheme } from "./theme";

addons.setConfig({
  theme: uixTheme,
  sidebar: { showRoots: true },
});
