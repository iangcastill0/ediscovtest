import type { PropertyTag } from "../property_tags.js";
import type { Property } from "../property.js";
import ByteBuffer from "bytebuffer";
import { Locale } from "./lcid.js";
export declare function x2(n: number): string;
/**
 * get an uppercase hex string of a number zero-padded to 2 digits
 * @param n {number}
 * @returns {string}
 */
export declare function X2(n: number): string;
/**
 * get an uppercase hex string of a number zero-padded to 4 digits
 * @param n {number} the number
 * @returns {string} 4-digit uppercase hex representation of the number
 */
export declare function X4(n: number): string;
/**
 * get an uppercase hex string of a number zero-padded to 8 digits
 * @param n {number} the number
 * @returns {string}
 */
export declare function X8(n: number): string;
export declare function name(tag: PropertyTag | Property): string;
export declare function shortName(tag: PropertyTag | Property): string;
/**
 * convert UTF-8 Uint8Array to string
 * @param array {Uint8Array}
 * @returns {string}
 */
export declare function utf8ArrayToString(array: Uint8Array): string;
/**
 * convert string to UTF-8 Uint8Array
 * @param str {string}
 * @returns {Uint8Array}
 */
export declare function stringToUtf8Array(str: string): Uint8Array;
/**
 * convert string to UTF-16LE Uint8Array
 * @param str {string}
 * @returns {Uint8Array|Uint8Array}
 */
export declare function stringToUtf16LeArray(str: string): Uint8Array;
/**
 * convert UTF-16LE Uint8Array to string
 * @param u8 {Uint8Array} raw bytes
 * @returns {string}
 */
export declare function utf16LeArrayToString(u8: Uint8Array): string;
/**
 * convert a string to a Uint8Array with terminating 0 byte
 * @throws if the string contains characters not in the ANSI range (0-255)
 * @param str
 */
export declare function stringToAnsiArray(str: string): Uint8Array;
/**
 * decode a string from a Uint8Array with terminating 0, interpreting the values as
 * ANSI characters.
 * @throws if the array does not have a terminating 0
 * @param u8 {Uint8Array}
 * @returns {string}
 */
export declare function ansiArrayToString(u8: Uint8Array): string;
/**
 * convert a file name to its DOS 8.3 version.
 * @param fileName {string} a file name (not a path!)
 */
export declare function fileNameToDosFileName(fileName: string): string;
/**
 * turn a ByteBuffer into a Uint8Array, using the current offset as a limit.
 * buf.limit will change to buf.offset, and its buf.offset will be reset to 0.
 * @param buf {ByteBuffer} the buffer to convert
 * @returns {Uint8Array} a new Uint8Array containing the
 */
export declare function byteBufferAsUint8Array(buf: ByteBuffer): Uint8Array;
/**
 * make an new byte buffer with the correct settings
 * @param otherBuffer {ByteBuffer | ArrayBuffer | Uint8Array} other buffer to wrap into a ByteBuffer
 * @param initCap {number?} initial capacity. ignored if otherBuffer is given.
 */
export declare function makeByteBuffer(initCap?: number, otherBuffer?: ByteBuffer | ArrayBuffer | Uint8Array): ByteBuffer;
export declare function getPathExtension(p: string): string;
export declare function isNullOrEmpty(str: string | null | undefined): boolean;
export declare function isNullOrWhiteSpace(str: string | null | undefined): boolean;
export declare function isNotNullOrWhitespace(str: string | null | undefined): str is string;
export declare function splitAtUnquoted(input: string, sep: string): Array<string>;
export declare function unquote(input: string): string;
export declare function localeId(): Locale;
/**
 * get the upper and lower 32 bits from a 64bit int in a bignum
 */
export declare function bigInt64ToParts(num: bigint): {
    lower: number;
    upper: number;
};
/**
 * create a 64bit int in a bignum from two 32bit ints in numbers
 * @param lower
 * @param upper
 */
export declare function bigInt64FromParts(lower: number, upper: number): bigint;
