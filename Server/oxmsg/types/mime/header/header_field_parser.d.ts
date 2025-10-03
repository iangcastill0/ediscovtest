import { ContentTransferEncoding, MailPriority } from "../../enums";
export declare type ContentType = {
    mediaType: string;
    boundary: string;
    charset: string;
    name: string;
    parameters: Record<string, string>;
};
export declare type ContentDisposition = {
    dispositionType: string;
    fileName: string;
    creationDate: number;
    modificationDate: number;
    readDate: number;
    size: number;
    parameters: Record<string, string>;
};
export declare class HeaderFieldParser {
    /**
     * Parses the Content-Transfer-Encoding header.
     * @param value {string} the value for the header to be parsed
     * @returns {string} a ContentTransferEncoding
     */
    static parseContentTransferEncoding(value: string): ContentTransferEncoding;
    /**
     * Parses an ImportanceType from a given Importance header value.
     * @param value {string} the value to be parsed
     * @returns {number} a mail priority, defaulting to normal if value is not recognized
     */
    static parseImportance(value: string): MailPriority;
    /**
     * parses the value for the content-type header into an object
     * @param value {string} the value to be parsed
     * @returns {ContentType}
     */
    static parseContentType(value: string): ContentType;
    /**
     * Parses a the value for the header Content-Disposition to an object
     * @param value {string} the header value to decode
     * @returns {ContentDisposition}
     */
    static parseContentDisposition(value: string): ContentDisposition;
    /**
     * Parses an ID like Message-Id and Content-Id.
     * Example:
     *    <test@test.com>
     * into
     *    test@test.com
     *
     * @param value {string} the id to parse
     * @returns {string} a parsed id
     */
    static parseId(value: string): string;
    /**
     * parses multiple ids from a single string like In-Reply-To
     * @param value {string} the value to parse
     */
    static parseMultipleIds(value: string): Array<string>;
}
