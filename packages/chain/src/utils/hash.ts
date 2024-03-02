import { CircuitString, Field, Poseidon } from "o1js";
import * as crypto from "crypto";

export function hashSha(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function hashPoseidon(input: string): Field {
  const inputCS = CircuitString.fromString(input);
  const inputFields = inputCS.toFields();
  return Poseidon.hash(inputFields);
}
