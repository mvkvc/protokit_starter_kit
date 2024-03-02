import { Field } from "o1js";
import { hashSha, hashPoseidon } from "./utils/option";
// import { preimageProgram, preimageProof } from "./completions";

// Everything needed for instantiating a ClientAppChain and easily submitting transactions should be here
export function hashData(data: string | object): Field {
  let inputString;
  if (typeof data === "string") {
    inputString = data;
  } else if (typeof data === "object") {
    inputString = JSON.stringify(data);
  } else {
    throw new Error("Invalid data type");
  }

  const hashedSha = hashSha(inputString);
  return hashPoseidon(hashedSha);
}

// Function to generate proof
