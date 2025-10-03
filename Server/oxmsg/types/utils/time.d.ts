/** https://stackoverflow.com/a/15550284
 * Convert a Microsoft OADate to ECMAScript Date
 * Treat all values as local.
 * OADate = number of days since 30 dec 1899 as a double value
 * @param {string|number} oaDate - OADate value
 * @returns {Date}
 */
export declare function oADateToDate(oaDate: number): Date;
/** https://stackoverflow.com/a/15550284
 * Convert an ECMAScript Date to a Microsoft OADate
 * Treat all dates as local.
 * @param {Date} date - Date to convert
 * @returns {Date}
 */
export declare function dateToOADate(date: Date): number;
export declare const FT_TICKS_PER_MS = 10000n;
export declare function fileTimeToDate(fileTime: bigint): Date;
export declare function dateToFileTime(date: Date): bigint;
