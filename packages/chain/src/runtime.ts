import { UInt32, UInt64 } from "o1js";
import { Balances } from "./runtime/balances";
import { Completions } from "./runtime/completions";

export default {
  modules: {
    Balances,
    Completions,
  },
  config: {
    Balances: {
      totalSupply: UInt64.from(10000),
    },
    Completions: {
      maxRewards: UInt64.from(32),
      minReward: UInt64.from(0),
    },
  },
};
