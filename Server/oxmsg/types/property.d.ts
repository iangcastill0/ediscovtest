import { PropertyType } from "./enums.js";
/**
 * A property inside the MSG file
 */
export declare class Property {
    readonly id: number;
    readonly type: PropertyType;
    readonly _flags: number;
    private readonly _multiValue;
    readonly _data: Uint8Array;
    constructor(obj: {
        id: number;
        type: PropertyType;
        data: Uint8Array;
        multiValue?: boolean;
        flags?: number;
    });
    name(): string;
    shortName(): string;
    flagsCollection(): Array<number>;
    asInt(): number;
    asSingle(): number;
    asDouble(): number;
    asDecimal(): number;
    asDateTime(): Date;
    asBool(): boolean;
    asLong(): number;
    asString(): string;
    asGuid(): Uint8Array;
    asBinary(): Uint8Array;
}
