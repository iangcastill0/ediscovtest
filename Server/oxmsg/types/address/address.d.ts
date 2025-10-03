import type { AddressType } from "../enums";
export declare class Address {
    readonly addressType: AddressType;
    readonly email: string;
    readonly displayName: string;
    constructor(email: string, displayName: string, addressType?: AddressType);
}
