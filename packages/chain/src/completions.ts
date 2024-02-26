import {
  RuntimeModule,
  runtimeModule,
  state,
  runtimeMethod,
} from "@proto-kit/module";
import { State, StateMap, assert } from "@proto-kit/protocol";
import { Field, Provable, PublicKey, Struct, UInt64 } from "o1js";

interface CompletionsConfig {
}

@runtimeModule()
export class Completions extends RuntimeModule<CompletionsConfig> {
  // @state() public completions  = ???
  // @state() public nullifiers = ???
  // @state() public counters = ???

  // @runtimeMethod()
  // public submitBatch(id: string, root: string, fee: UInt64): void {
  // }

  // @runtimeMethod()
  // public verifyBatch(id: string, root: string, position: UInt64, proof: string): void {
  // }

  // private calculateReward(fee: UInt64, completions: UInt64): UInt64 {
  //   // Quadratic decay
  //   // const reward = fee.value.multiply(completions.value.pow(2));
  //   // return reward;
  // }
}
