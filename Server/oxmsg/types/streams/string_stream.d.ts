import type ByteBuffer from "bytebuffer";
import type { CFBStorage } from "../cfb_storage.js";
/**
 * The string stream MUST be named "__substg1.0_00040102". It MUST consist of one entry for each
 * string named property, and all entries MUST be arranged consecutively, like in an array.
 * As specified in section 2.2.3.1.2, the offset, in bytes, to use for a particular property is stored in the
 * corresponding entry in the entry stream.That is a byte offset into the string stream from where the
 * entry for the property can be read.The strings MUST NOT be null-terminated. Implementers can add a
 * terminating null character to the string
 * See https://msdn.microsoft.com/en-us/library/ee124409(v=exchg.80).aspx
 */
export declare class StringStream extends Array<StringStreamItem> {
    /**
     * create StringStream and read all the StringStreamItems from the given storage, if any.
     */
    constructor(storage?: CFBStorage);
    /**
     * write all the StringStreamItems as a stream to the storage
     * @param storage
     */
    write(storage: any): void;
}
/**
 * Represents one Item in the StringStream
 */
export declare class StringStreamItem {
    /**
     * the length of the following name field in bytes
     * was uint
     * @type number
     */
    readonly length: number;
    /**
     * A Unicode string that is the name of the property. A new entry MUST always start
     * on a 4 byte boundary; therefore, if the size of the Name field is not an exact multiple of 4, and
     * another Name field entry occurs after it, null characters MUST be appended to the stream after it
     * until the 4-byte boundary is reached.The Name Length field for the next entry will then start at
     * the beginning of the next 4-byte boundary
     * @type {string}
     */
    readonly name: string;
    /**
     * create a StringStreamItem from a byte buffer
     * @param buf {ByteBuffer}
     */
    static fromBuffer(buf: ByteBuffer): StringStreamItem;
    constructor(name: string);
    /**
     * write this item to the ByteBuffer
     * @param buf {ByteBuffer}
     */
    write(buf: ByteBuffer): void;
    /**
     * Extract 4 from the given <paramref name="length"/> until the result is smaller
     * than 4 and then returns this result
     * @param length {number} was uint
     */
    static get4BytesBoundary(length: number): number;
}
