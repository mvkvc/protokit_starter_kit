import {
  RuntimeModule,
  runtimeModule,
  state,
  runtimeMethod
} from "@proto-kit/module";
import { StateMap, State, assert } from "@proto-kit/protocol";
import {
  Field,
  PublicKey,
  Struct,
  UInt64,
  CircuitString,
  Provable,
  Bool,
  Experimental,
} from "o1js";
import { inject } from "tsyringe";
import { Balances } from "./balances";
import { unwrap } from "./utils";

const MAX_REWARDS = 16;
class KeysRewards extends Struct({
  keys: Provable.Array(PublicKey, MAX_REWARDS),
}) {
  public static empty(): KeysRewards {
    const keys = new Array(MAX_REWARDS).fill(PublicKey.fromBase58(""));
    return new KeysRewards({ keys });
  }
}

export class Job extends Struct({
  reward: UInt64,
  deadline: UInt64,
  paid: Bool,
  mostVerifiedHash: CircuitString,
}) {}
export class Result extends Struct({
  id: UInt64,
  hash: CircuitString,
}) {}
export class Nullifier extends Struct({
  id: UInt64,
  publicKey: PublicKey,
}) {}

// const verify = () => {
//   Bool(true);
// }

// const preimageProgram = Experimental.ZkProgram({
//   publicOutput: Field,
//   publicInput: Bool,

//   methods: {
//     verify: {
//       privateInputs: [],
//       // eslint-disable-next-line putout/putout
//       method: verify,
//     },
//   },
// });

// class PreimageProof extends Experimental.ZkProgram.Proof(preimageProgram) {}

interface CompletionsConfig {
  maxRewards: UInt64;
  minReward: UInt64;
}

@runtimeModule()
export class Completions extends RuntimeModule<CompletionsConfig> {
  public constructor(@inject("Balances") private balances: Balances) {
    super();
  }

  @state() public jobID = State.from<UInt64>(UInt64);
  @state() public jobs = StateMap.from<UInt64, Job>(UInt64, Job);
  @state() public results = StateMap.from<Result, KeysRewards>(Result, KeysRewards);
  @state() public nullifiers = StateMap.from<Nullifier, Field>(
    Nullifier,
    Field,
  );

  @runtimeMethod()
  public submit(reward: UInt64, durationBlocks: UInt64): void {
    const isOverMinReward = reward.greaterThanOrEqual(this.config.minReward);
    assert(isOverMinReward, "Reward is too low");

    this.balances.burnBalance(this.transaction.sender, reward);

    const jobID = unwrap(this.jobID.get(), "Job ID not found", UInt64.from(0));
    const newjobID = jobID.add(UInt64.from(1));
    const deadline = this.network.block.height.add(durationBlocks);
    const job = new Job({
      reward,
      deadline,
      paid: Bool(false),
      mostVerifiedHash: CircuitString.fromString(""),
    });

    this.jobID.set(newjobID);
    this.jobs.set(newjobID, job);
  }

  @runtimeMethod()
  public verify(): void {}

  @runtimeMethod()
  public payout(id: UInt64): void {
    const jobOption = this.jobs.get(id);
    const job = unwrap(jobOption, "Job not found");

    const isPaid = job.paid;
    assert(isPaid, "Job already paid");

    const deadlinePending = job.deadline.lessThanOrEqual(this.network.block.height);
    assert(deadlinePending, "Job deadline has not passed");

    const result = new Result({
      id,
      hash: job.mostVerifiedHash,
    });
    const resultRewardeesOption = this.results.get(result);
    const resultRewardees = unwrap(resultRewardeesOption, "Result rewardees not found");
    const individualReward = job.reward.div(MAX_REWARDS);
    resultRewardees.keys.forEach((rewardee) => {
      this.balances.mintBalance(rewardee, individualReward);
    });

    const updatedJob = new Job({
      ...job,
      paid: Bool(true),
    });

    this.jobs.set(id, updatedJob);
  }
}
