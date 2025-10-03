import { Address } from "./address";
import type { AddressType } from "../enums";
import { MessageFormat } from "../enums";
export declare class OneOffEntryId extends Address {
    private readonly _messageFormat;
    private readonly _canLookupEmailAddress;
    constructor(email: string, displayName: string, addressType?: AddressType, messageFormat?: MessageFormat, canLookupEmailAddress?: boolean);
    toByteArray(): Uint8Array;
}
