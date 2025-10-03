/**
 * Thanks to http://stackoverflow.com/a/7333402/477854 for inspiration
 * This class can convert from strings like "104 kB" (104 kilobytes) to bytes.
 * It does not know about differences such as kilobits vs kilobytes.
 */
export declare class SizeParser {
    static parse(value: string): number;
    static extractUnit(sizeWithUnit: string): string;
    static isDigit(value: string): boolean;
    static multiplicatorForUnit(unit: string): number;
}
