import { Address } from "./address";
import { AddressType, MapiObjectType, RecipientRowDisplayType, RecipientType } from "../enums";
import type { CFBStorage } from "../cfb_storage";
/**
 * Wrapper around a list of recipients
 */
export declare class Recipients extends Array<Recipient> {
    /**
     * add a new To-Recipient to the list
     * @param email email address of the recipient
     * @param displayName display name of the recipient (optional)
     * @param addressType address type of the recipient (default SMTP)
     * @param objectType mapiObjectType of the recipient (default MAPI_MAILUSER)
     * @param displayType recipientRowDisplayType of the recipient (default MessagingUser)
     */
    addTo(email: string, displayName?: string, addressType?: AddressType, objectType?: MapiObjectType, displayType?: RecipientRowDisplayType): void;
    /**
     * add a new Cc-Recipient to the list
     * @param email email address of the recipient
     * @param displayName display name of the recipient (optional)
     * @param addressType address type of the recipient (default SMTP)
     * @param objectType mapiObjectType of the recipient (default MAPI_MAILUSER)
     * @param displayType recipientRowDisplayType of the recipient (default MessagingUser)
     */
    addCc(email: string, displayName?: string, addressType?: AddressType, objectType?: MapiObjectType, displayType?: RecipientRowDisplayType): void;
    addBcc(email: string, displayName?: string, addressType?: AddressType, objectType?: MapiObjectType, displayType?: RecipientRowDisplayType): void;
    writeToStorage(rootStorage: CFBStorage): number;
}
export declare class Recipient extends Address {
    private readonly _rowId;
    readonly recipientType: RecipientType;
    private readonly _displayType;
    private readonly _objectType;
    constructor(rowId: number, email: string, displayName: string, addressType: AddressType, recipientType: RecipientType, objectType: MapiObjectType, displayType: RecipientRowDisplayType);
    writeProperties(storage: CFBStorage): number;
}
