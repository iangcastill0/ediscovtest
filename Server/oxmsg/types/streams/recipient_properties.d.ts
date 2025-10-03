import { Properties } from "../properties.js";
import type { CFBStorage } from "../cfb_storage.js";
import type ByteBuffer from "bytebuffer";
/**
 * The properties stream contained inside an Recipient storage object.
 */
export declare class RecipientProperties extends Properties {
    writeProperties(storage: CFBStorage, prefix: (arg0: ByteBuffer) => void, messageSize?: number): number;
}
