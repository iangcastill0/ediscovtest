import type { AddressType } from "../enums";
import { MessageFormat } from "../enums";
import { Address } from "./address";
import type { TopLevelProperties } from "../streams/top_level_properties";
export declare class Sender extends Address {
    private readonly _messageFormat;
    private readonly _canLookupEmailAddress;
    private readonly _senderIsCreator;
    constructor(email: string, displayName: string, addressType?: AddressType, messageFormat?: MessageFormat, canLookupEmailAddress?: boolean, senderIsCreator?: boolean);
    writeProperties(stream: TopLevelProperties): void;
}
