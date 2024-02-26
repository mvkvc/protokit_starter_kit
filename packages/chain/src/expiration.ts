import { AfterBlockParameters, BeforeBlockParameters, NetworkState, ProvableBlockHook } from "@proto-kit/protocol";
import { Balances } from "./balances";
import { Completions } from "./completions";

// export class ExpirationModule extends ProvableBlockHook {
//     public constructor(
//         @inject("Runtime") runtime: Runtime<RuntimeModulesRecord>
//       ) {
//         super();
//         this.balances = runtime.resolveOrFail("Balances", Balances);
//         this.completions = runtime.resolveOrFail("Completions", Completions);
//       }

//     public beforeBlock(blockData: BeforeBlockParameters): NetworkState {

//     }

//     public afterBlock(blockData: AfterBlockParameters): NetworkState {

//     }
// };
