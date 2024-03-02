import { ClientAppChain } from "@proto-kit/sdk";
import runtime from "./runtime";

const appChain = ClientAppChain.fromRuntime(runtime);

export function getClient(graphqlURL: string | undefined = undefined) {
  appChain.configurePartial({
    GraphqlClient: {
      url: graphqlURL || "https://replicant-chain.fly.dev",
    },
  });
}

export const client = appChain;
