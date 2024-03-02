import { Option, assert } from "@proto-kit/protocol";
import { CircuitString, Field, Poseidon } from "o1js";
import * as crypto from "crypto";

// Check if isSome and throw with assert and message if no default otherwise set
export function unwrap<T>(
  option: Option<T>,
  message: string,
  default_: T | undefined = undefined,
): T {
  const isSome = option.isSome;

  if (default_ === undefined && !isSome.toBoolean()) {
    assert(isSome.not(), message);
  }

  let result: T = default_ !== undefined ? default_ : option.value;

  return result;
}

export function hashSha(input: string): string {
  return crypto.createHash("sha256")
    .update(input)
    .digest("hex");
}

export function hashPoseidon(input: string): Field {
  const inputCS = CircuitString.fromString(input);
  const inputFields = inputCS.toFields();
  return Poseidon.hash(inputFields);
}
