import { Properties } from "../properties.js";
import type ByteBuffer from "bytebuffer";
import type { CFBStorage } from "../cfb_storage.js";
/**
 * The properties stream contained inside the top level of the .msg file, which represents the Message object itself.
 */
export declare class TopLevelProperties extends Properties {
    nextRecipientId: number;
    nextAttachmentId: number;
    recipientCount: number;
    attachmentCount: number;
    /**
     *
     * @param storage
     * @param prefix
     * @param messageSize
     */
    writeProperties(storage: CFBStorage, prefix: (arg0: ByteBuffer) => void, messageSize?: number): number;
}
