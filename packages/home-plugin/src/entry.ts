import { airConditionerPlugin } from './plugin'

// The host reads `globalThis.plugin` after evaluating this script.
;

(globalThis as { plugin?: unknown }).plugin = airConditionerPlugin
