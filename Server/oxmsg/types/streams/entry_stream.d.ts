import type ByteBuffer from "bytebuffer";
import { PropertyKind } from "../enums.js";
import { CFBStorage } from "../cfb_storage.js";
/**
 * The entry stream MUST be named "__substg1.0_00030102" and consist of 8-byte entries, one for each
 * named property being stored. The properties are assigned unique numeric IDs (distinct from any property
 * ID assignment) starting from a base of 0x8000. The IDs MUST be numbered consecutively, like an array.
 * In this stream, there MUST be exactly one entry for each named property of the Message object or any of
 * its subobjects. The index of the entry for a particular ID is calculated by subtracting 0x8000 from it.
 * For example, if the ID is 0x8005, the index for the corresponding 8-byte entry would be 0x8005 – 0x8000 = 5.
 * The index can then be multiplied by 8 to get the actual byte offset into the stream from where to start
 * reading the corresponding entry.
 *
 * see: https://msdn.microsoft.com/en-us/library/ee159689(v=exchg.80).aspx
 */
export declare class EntryStream extends Array<EntryStreamItem> {
    /**
     * creates this object and reads all the EntryStreamItems from
     * the given storage
     */
    constructor(storage?: CFBStorage);
    /**
     * writes all the EntryStreamItems as a stream to the storage
     */
    write(storage: CFBStorage, streamName?: string): void;
}
/**
 * Represents one item in the EntryStream
 */
export declare class EntryStreamItem {
    /**
     * the Property Kind subfield of the Index and Kind Information field), this value is the LID part of the
     * PropertyName structure, as specified in [MS-OXCDATA] section 2.6.1. If this property is a string named
     * property, this value is the offset in bytes into the strings stream where the value of the Name field of
     * the PropertyName structure is located.
     * was ushort
     * */
    readonly nameIdentifierOrStringOffset: number;
    readonly nameIdentifierOrStringOffsetHex: string;
    /**
     * The following structure specifies the stream indexes and whether the property is a numerical
     * named property or a string named property
     * @type {IndexAndKindInformation}
     */
    readonly indexAndKindInformation: IndexAndKindInformation;
    /**
     * creates this objcet and reads all the properties from the given buffer
     * @param buf {ByteBuffer}
     */
    static fromBuffer(buf: ByteBuffer): EntryStreamItem;
    /**
     * creates this object from the properties
     * @param nameIdentifierOrStringOffset {number}
     * @param indexAndKindInformation {IndexAndKindInformation}
     */
    constructor(nameIdentifierOrStringOffset: number, indexAndKindInformation: IndexAndKindInformation);
    /**
     * write all the internal properties to the given buffer
     * @param buf {ByteBuffer}
     */
    write(buf: ByteBuffer): void;
}
export declare class IndexAndKindInformation {
    readonly propertyIndex: number;
    readonly guidIndex: number;
    readonly propertyKind: PropertyKind;
    static fromBuffer(buf: ByteBuffer): IndexAndKindInformation;
    constructor(propertyIndex: number, guidIndex: number, propertyKind: PropertyKind);
    write(buf: ByteBuffer): void;
}
