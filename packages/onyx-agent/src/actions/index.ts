import { Action } from "@elizaos/core";

export { gatewayAction } from "./gateway.js";
export { searchAction } from "./search.js";
export { tradeAction } from "./trade.js";
export { shieldAction } from "./shield.js";
export { bridgeAction } from "./bridge.js";
export { researchAction } from "./research.js";
export { learnAction } from "./learn.js";
export { memorizeAction } from "./memorize.js";
export { browseAction } from "./browse.js";
export { recallAction } from "./recall.js";

import { gatewayAction } from "./gateway.js";
import { searchAction } from "./search.js";
import { tradeAction } from "./trade.js";
import { shieldAction } from "./shield.js";
import { bridgeAction } from "./bridge.js";
import { researchAction } from "./research.js";
import { learnAction } from "./learn.js";
import { memorizeAction } from "./memorize.js";
import { browseAction } from "./browse.js";
import { recallAction } from "./recall.js";

export const allActions: Action[] = [
  gatewayAction,
  searchAction,
  tradeAction,
  shieldAction,
  bridgeAction,
  researchAction,
  learnAction,
  memorizeAction,
  browseAction,
  recallAction,
];