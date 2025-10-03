import { Address } from "./address";
import type { AddressType } from "../enums";
import { TopLevelProperties } from "../streams/top_level_properties";
export declare class Representing extends Address {
    constructor(email: string, displayName: string, addressType?: AddressType);
    writeProperties(stream: TopLevelProperties): void;
}
