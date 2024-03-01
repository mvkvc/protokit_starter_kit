import { UInt32, UInt64 } from "o1js";
import { Balances } from "./balances";
import { Completions } from "./completions";

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
      minReward: UInt64.from(0)
    },
  },
};
