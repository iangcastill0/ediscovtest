/**
 * Class that holds information about one "Received:" header line.
 * Visit these RFCs for more information:
 * RFC 5321 section 4.4
 * RFC 4021 section 3.6.7
 * RFC 2822 section 3.6.7
 * RFC 2821 section 4.4
 */
export declare class Received {
    date: number;
    names: Record<string, string>;
    raw: string;
    constructor(headerValue: string);
    /**
     * Parses the Received header name-value-list into a dictionary.
     * @param headerValue {string} The full header value for the Received header
     * @returns {{[string]: string}}
     */
    static parseValue(headerValue: string): Record<string, string>;
}
