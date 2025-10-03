import { RfcMailAddress } from "./rfc_mail_address.js";
import { Received } from "./received.js";
import { ContentTransferEncoding, MailPriority } from "../../enums.js";
import type { ContentDisposition, ContentType } from "./header_field_parser.js";
declare type HeaderDict = Record<string, Array<string>>;
export declare class MessageHeader {
    /**    Contains all the headers as a map */
    raw: HeaderDict;
    custom: HeaderDict;
    contentDescription: string | null;
    contentId: string | null;
    keywords: Array<string>;
    dispositionNotificationTo: Array<RfcMailAddress>;
    received: Array<Received>;
    importance: MailPriority;
    contentTransferEncoding: ContentTransferEncoding;
    to: Array<RfcMailAddress>;
    cc: Array<RfcMailAddress>;
    bcc: Array<RfcMailAddress>;
    from: RfcMailAddress | null;
    replyTo: RfcMailAddress | null;
    inReplyTo: Array<string>;
    references: Array<string>;
    sender: RfcMailAddress | null;
    contentType: ContentType | null;
    contentDisposition: ContentDisposition | null;
    date: string | null;
    dateSent: number | null;
    messageId: string | null;
    mimeVersion: string | null;
    returnPath: RfcMailAddress | null;
    subject: string | null;
    private _clear;
    constructor(rawHeaders: HeaderDict);
    private _parseHeaders;
    private _parseHeader;
}
export {};
