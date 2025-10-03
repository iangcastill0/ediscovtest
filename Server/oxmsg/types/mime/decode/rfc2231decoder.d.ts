export declare type KeyValueList = Array<{
    key: string;
    value: string;
}>;
/**
 * This class is responsible for decoding parameters that has been encoded with:
 * Continuation:
 *         This is where a single parameter has such a long value that it could
 *         be wrapped while in transit. Instead multiple parameters is used on each line.
 *
 *         Example:
 *         From: Content-Type: text/html; boundary="someVeryLongStringHereWhichCouldBeWrappedInTransit"
 *         To:
 *         Content-Type: text/html; boundary*0="someVeryLongStringHere" boundary*1="WhichCouldBeWrappedInTransit"
 * Encoding:
 *         Sometimes other characters then ASCII characters are needed in parameters.
 *         The parameter is then given a different name to specify that it is encoded.
 *         Example:
 *         From: Content-Disposition attachment; filename="specialCharsÆØÅ"
 *         To: Content-Disposition attachment; filename*="ISO-8859-1'en-us'specialCharsC6D8C0"
 *         This encoding is almost the same as EncodedWord encoding, and is used to decode the value.
 *
 * Continuation and Encoding:
 *         Both Continuation and Encoding can be used on the same time.
 *         Example:
 *         From: Content-Disposition attachment; filename="specialCharsÆØÅWhichIsSoLong"
 *         To:
 *             Content-Disposition attachment; filename*0*="ISO-8859-1'en-us'specialCharsC6D8C0";
 *             filename*1*="WhichIsSoLong"
 *         This could also be encoded as:
 *         To:
 *             Content-Disposition attachment; filename*0*="ISO-8859-1'en-us'specialCharsC6D8C0";
 *             filename*1="WhichIsSoLong"
 *         Notice that filename*1 does not have an * after it - denoting it IS NOT encoded.
 *         There are some rules about this:
 *             1. The encoding must be mentioned in the first part (filename*0*), which has to be encoded.
 *             2. No other part must specify an encoding, but if encoded it uses the encoding mentioned in the
 *                 first part.
 *            3. Parts may be encoded or not in any order.
 *
 * More information and the specification is available in RFC 2231 (http://tools.ietf.org/html/rfc2231)
 */
export declare class Rfc2231Decoder {
    /**
     * Decodes a string of the form:
     *
     * value0; key1=value1; key2=value2; key3=value3
     *
     * The returned List of key value pairs will have the key as key and the decoded value as value.
     * The first value0 will have a key of ""
     *
     * If continuation is used, then multiple keys will be merged into one key with the different values
     * decoded into on big value for that key.
     * Example:
     *   title*0=part1
     *   title*1=part2
     * will have key and value of:
     *
     * title=decode(part1)decode(part2)
     *
     * @param input {string} the string to decode
     * @returns {Array<{key: string, value: string}>} a list of decoded key-value-pairs
     */
    static decode(input: string): KeyValueList;
    /**
     * Decodes the list of key value pairs into a decoded list of key value pairs.<br />
     * There may be less keys in the decoded list, but then the values for the lost keys will have been appended
     * to the new key.
     * @param pairs {Array<{key: string, value: string}>} the pairs to decode
     * @returns {Array<{key: string, value: string}>} the decoded pairs
     */
    static decodePairs(pairs: KeyValueList): KeyValueList;
    static detectEncoding(input: string): string | null;
    /**
   and encodingUsed will be set to null
   * @param input {string} the value to decode
   * @returns {{decoded:string, encodingUsed: string}} decoded value and used encoding (for later use)
   */
    /**
     * This will decode a single value of the form: ISO-8859-1'en-us'%3D%3DIamHere
     * Which is basically a EncodedWord form just using % instead of =
     * Notice that 'en-us' part is not used for anything.
     *
     * If the single value given is not on the correct form, it will be returned without
     * being decoded
     *
     * @param input {string} the value to decode
     * @param encoding {string} the encoding used to decode with
     * @returns {string} decoded value corresponding to input
     */
    static decodeSingleValue(input: string, encoding: string | null): string;
}
