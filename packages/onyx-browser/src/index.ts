import type { Tab, Cookie, Snapshot, Element, SearchResult } from "./types";

export type { Tab, Cookie, Snapshot, Element, SearchResult };

export { createTab } from "./actions/create-tab";
export { getSnapshot } from "./actions/get-snapshot";
export { click } from "./actions/click";
export { navigate } from "./actions/navigate";
export { typeText } from "./actions/type-text";
export { scroll } from "./actions/scroll";
export { screenshot } from "./actions/screenshot";
export { closeTab } from "./actions/close-tab";
export { setTab, getTab, getAllTabs, getTabsCount, deleteTab, closeAllTabs } from "./state";