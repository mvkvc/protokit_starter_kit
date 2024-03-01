import { ClientAppChain } from "@proto-kit/sdk";
import runtime from "./runtime";

const appChain = ClientAppChain.fromRuntime(runtime);

const graphqlHost = process.env.CHAIN_GRAPHQL_HOST || "0.0.0.0";
const graphqlPORT = process.env.CHAIN_GRAPHQL_PORT || "8080";
const graphqlURL = `http://${graphqlHost}:${graphqlPORT}/graphql`;

appChain.configurePartial({
  GraphqlClient: {
    url: graphqlURL,
  },
});

export const client = appChain;
