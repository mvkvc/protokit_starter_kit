import {
  RuntimeModule,
  runtimeModule,
  state,
  runtimeMethod,
} from "@proto-kit/module";
import { State, StateMap, assert } from "@proto-kit/protocol";
import { Field, Provable, PublicKey, Struct, UInt64 } from "o1js";

interface BalancesConfig {
  totalSupply: UInt64;
}

@runtimeModule()
export class Balances extends RuntimeModule<BalancesConfig> {
  @state() public balances = StateMap.from<PublicKey, UInt64>(
    PublicKey,
    UInt64,
  );

  @state() public circulatingSupply = State.from<UInt64>(UInt64);

  public mintBalance(address: PublicKey, amount: UInt64): void {
    const circulatingSupply = this.circulatingSupply.get();
    const newCirculatingSupply = circulatingSupply.value.add(amount);
    assert(
      newCirculatingSupply.lessThanOrEqual(this.config.totalSupply),
      "Circulating supply would be higher than total supply",
    );
    this.circulatingSupply.set(newCirculatingSupply);
    const currentBalance = this.balances.get(address);
    const newBalance = currentBalance.value.add(amount);
    this.balances.set(address, newBalance);
  }

  public burnBalance(address: PublicKey, amount: UInt64): void {
    const currentBalance = this.balances.get(address);
    const newBalance = currentBalance.value.sub(amount);
    const newBalanceNonzero = newBalance.greaterThanOrEqual(UInt64.from(0));
    assert(newBalanceNonzero, "Balance would be negative");
    this.balances.set(address, newBalance);
  }

  @runtimeMethod()
  public addBalance(address: PublicKey, amount: UInt64): void {
    this.mintBalance(address, amount);
  }

  @runtimeMethod()
  public transferBalance(to: PublicKey, amount: UInt64): void {
    const fromBalance = this.balances.get(this.transaction.sender);
    const sufficientBalance = fromBalance.value.greaterThanOrEqual(amount);
    assert(sufficientBalance, "Insufficient balance");

    this.mintBalance(to, amount);
    this.burnBalance(this.transaction.sender, amount);
  }
}
