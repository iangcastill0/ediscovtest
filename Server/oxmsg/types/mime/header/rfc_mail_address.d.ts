import type { Address } from "address-rfc2822";
export declare class RfcMailAddress {
    toString(): string;
    readonly address: string;
    readonly displayName: string;
    readonly raw: string;
    readonly mailAddress: Address | null;
    hasValidMailAddress(): boolean;
    constructor(mailAddress: Address | null, raw: string);
    static parseMailAddress(input: string): RfcMailAddress;
    static parseMailAddresses(input: string): Array<RfcMailAddress>;
}
