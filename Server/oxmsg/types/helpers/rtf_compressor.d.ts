/**
 * Takes in input, compresses it using LZFu by Microsoft. Can be viewed in the [MS-OXRTFCP].pdf document.
 * https://msdn.microsoft.com/en-us/library/cc463890(v=exchg.80).aspx. Returns the input as a byte array.
 * @param input {Uint8Array} the input to compress
 * @returns {Uint8Array} compressed input
 */
export declare function compress(input: Uint8Array): Uint8Array;
