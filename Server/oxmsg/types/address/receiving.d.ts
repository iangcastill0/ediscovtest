import type { AddressType } from "../enums";
import { Address } from "./address";
import { TopLevelProperties } from "../streams/top_level_properties";
export declare class Receiving extends Address {
    constructor(email: string, displayName: string, addressType?: AddressType);
    writeProperties(stream: TopLevelProperties): void;
}
