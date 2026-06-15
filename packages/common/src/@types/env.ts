import type { EnvNumber, EnvString } from "envkist";

type ResolvableString = string | EnvString<string | undefined>;
type ResolvableNumber = number | EnvNumber<number | undefined>;

export type { ResolvableNumber, ResolvableString };
