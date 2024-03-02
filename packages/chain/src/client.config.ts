import { ClientAppChain } from "@proto-kit/sdk";
import { Field } from "o1js";
import runtime from "./runtime";
import { hashSha, hashPoseidon } from "./utils";
// import { preimageProgram, preimageProof } from "./completions";

// Everything needed for instantiating a ClientAppChain and easily submitting transactions should be here

const appChain = ClientAppChain.fromRuntime(runtime);

export function getClient(graphqlURL: string | undefined = undefined) {
  appChain.configurePartial({
    GraphqlClient: {
      url: graphqlURL || 'https://replicant-chain.fly.dev',
    },
  });
}

export function hashData(data: string | object): Field {
  let inputString;
  if (typeof data === 'string') {
    inputString = data;
  } else if (typeof data === 'object') {
    inputString = JSON.stringify(data);
  } else {
    throw new Error('Invalid data type');
  }

  const hashedSha = hashSha(inputString);
  return hashPoseidon(hashedSha)
}

// Function to generate proof
