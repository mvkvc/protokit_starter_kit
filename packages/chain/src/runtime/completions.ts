import {
  RuntimeModule,
  runtimeModule,
  state,
  runtimeMethod,
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
  Poseidon,
} from "o1js";
import { inject } from "tsyringe";
import { Balances } from "./balances";
import { unwrap } from "../utils/option";

const MAX_REWARDS = Number.parseInt(process.env.CHAIN_MAX_REWARDEES || "10");
const BURN_ADDRESS =
  process.env.CHAIN_BURN_ADDRESS ||
  "B62qiburnzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzmp7r7UN6X";

class RewardKeys extends Struct({
  keys: Provable.Array(PublicKey, MAX_REWARDS),
}) {
  public static empty(): RewardKeys {
    const keys = new Array(MAX_REWARDS).fill(
      PublicKey.fromBase58(BURN_ADDRESS),
    );
    return new RewardKeys({ keys });
  }
}

export class Job extends Struct({
  reward: UInt64,
  deadline: UInt64,
  paid: Bool,
  mostVerifiedHash: Field,
  mostVerifiedCount: UInt64,
}) {}
export class Result extends Struct({
  id: UInt64,
  hash: Field,
}) {}
export class Nullifier extends Struct({
  id: UInt64,
  publicKey: PublicKey,
}) {}

const preimageProgram = Experimental.ZkProgram({
  name: "preimage",
  publicInput: Field,

  methods: {
    verify: {
      privateInputs: [CircuitString],
      method: (publicInput: Field, preimage: CircuitString) => {
        Poseidon.hash(preimage.toFields()).assertEquals(publicInput);
      },
    },
  },
});

class PreimageProof extends Experimental.ZkProgram.Proof(preimageProgram) {}

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
  @state() public resultCounts = StateMap.from<Result, UInt64>(Result, UInt64);
  @state() public resultRewards = StateMap.from<Result, RewardKeys>(
    Result,
    RewardKeys,
  );
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
      mostVerifiedHash: Field(0),
      mostVerifiedCount: UInt64.from(0),
    });

    this.jobID.set(newjobID);
    this.jobs.set(newjobID, job);
  }

  @runtimeMethod()
  public verify(id: UInt64, hash: Field, preimageProof: PreimageProof): void {
    const nullifier = new Nullifier({
      id: id,
      publicKey: this.transaction.sender,
    });
    const noNullifier = this.nullifiers.get(nullifier).isSome.not();
    assert(noNullifier, "Nullifier present already verified");

    this.nullifiers.set(nullifier, Field(1));

    preimageProof.verify();
    preimageProof.publicInput.assertEquals(hash);

    const resultKey = new Result({
      id: id,
      hash: hash,
    });
    const resultCountOption = this.resultCounts.get(resultKey);
    const resultCount = unwrap(
      resultCountOption,
      "Result count not found",
      UInt64.from(0),
    );
    const newResultCount = resultCount.add(1);
    this.resultCounts.set(resultKey, newResultCount);

    const jobOption = this.jobs.get(id);
    const job = unwrap(jobOption, "Job not found");

    const isNewMostVerified = job.mostVerifiedHash
      .equals(hash)
      .not()
      .and(job.mostVerifiedCount.lessThan(newResultCount));

    const newJob = new Job({
      ...job,

      mostVerifiedHash: isNewMostVerified ? hash : job.mostVerifiedHash,
      mostVerifiedCount: isNewMostVerified
        ? newResultCount
        : job.mostVerifiedCount,
    });
    this.jobs.set(id, newJob);
  }

  @runtimeMethod()
  public payout(id: UInt64): void {
    const jobOption = this.jobs.get(id);
    const job = unwrap(jobOption, "Job not found");

    const isPaid = job.paid;
    assert(isPaid, "Job already paid");

    const deadlinePending = job.deadline.lessThanOrEqual(
      this.network.block.height,
    );
    assert(deadlinePending, "Job deadline has not passed");

    const result = new Result({
      id,
      hash: job.mostVerifiedHash,
    });
    const resultRewardeesOption = this.resultRewards.get(result);
    const resultRewardees = unwrap(
      resultRewardeesOption,
      "Result rewardees not found",
    );
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
