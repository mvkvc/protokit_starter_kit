import { Option, assert } from "@proto-kit/protocol";

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
