import { Message } from "./message.js";
import { Recipients } from "./address/recipients.js";
import { MessageImportance, MessageEditorFormat, MessagePriority } from "./enums.js";
import type { MessageHeader } from "./mime/header/message_header.js";
import { Sender } from "./address/sender.js";
import { Attachments } from "./attachments.js";
import { Attachment } from "./attachment.js";
export declare type Recipient = {
    address: string;
    name?: string;
};
export declare class Email extends Message {
    readonly recipients: Recipients;
    readonly replyToRecipients: Recipients;
    readonly attachments: Attachments;
    private _subject;
    _sender: Sender | null;
    private _representing;
    private _receiving;
    private _receivingRepresenting;
    subjectPrefix: string | null;
    private _subjectNormalized;
    readonly priority: MessagePriority;
    importance: MessageImportance;
    private _bodyText;
    private _bodyHtml;
    private _bodyRtf;
    bodyRtfCompressed: boolean | null;
    private _sentOn;
    private _receivedOn;
    /**
     * Corresponds to the message ID field as specified in [RFC2822].
     * If set then this value will be used, when not set the value will be read from the
     * TransportMessageHeaders when this property is set
     */
    internetMessageId: string | null;
    internetReferences: string | null;
    inReplyToId: string | null;
    transportMessageHeadersText: string | null;
    transportMessageHeaders: MessageHeader | null;
    readonly draft: boolean;
    readonly readReceipt: boolean;
    messageEditorFormat: MessageEditorFormat | null;
    constructor(draft?: boolean, readReceipt?: boolean);
    sender(address: string, displayName?: string): Email;
    bodyHtml(html: string): Email;
    bodyText(txt: string): Email;
    bodyFormat(fmt: MessageEditorFormat): Email;
    subject(subject: string): Email;
    to(address: string, displayName?: string): Email;
    cc(address: string, displayName?: string): Email;
    bcc(address: string, displayName?: string): Email;
    replyTo(address: string, displayName?: string): Email;
    tos(recipients: Array<Recipient>): Email;
    ccs(recipients: Array<Recipient>): Email;
    bccs(recipients: Array<Recipient>): Email;
    replyTos(recipients: Array<Recipient>): Email;
    sentOn(when: Date | null): Email;
    receivedOn(when: Date | null): Email;
    attach(attachment: Attachment): Email;
    /**
     * the raw transport headers
     * @param headers
     */
    headers(headers: string): Email;
    msg(): Uint8Array;
    _setSubject(): void;
    /**
     * write to the cfb of the underlying message
     */
    _writeToStorage(): void;
}
