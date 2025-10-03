/**
 * The PidTagReportTag property ([MS-OXPROPS] section 2.917) contains the data that is used to correlate the report
 * and the original message. The property can be absent if the sender does not request a reply or response to the
 * original e-mail message. If the original E-mail object has either the PidTagResponseRequested property (section
 * 2.2.1.46) set to 0x01 or the PidTagReplyRequested property (section 2.2.1.45) set to 0x01, then the property is set
 * on the original E-mail object by using the following format.
 * See https://msdn.microsoft.com/en-us/library/ee160822(v=exchg.80).aspx
 */
export declare class ReportTag {
    cookie: string;
    version: number;
    storeEntryIdSize: number;
    folderEntryIdSize: number;
    folderEntryId: number;
    messageEntryIdSize: number;
    messageEntryId: number;
    searchFolderEntryIdSize: number;
    messageSearchKeySize: number;
    ansiText: string;
    constructor(ansiText: string);
    /**
     * Returns this object as a byte array
     */
    toByteArray(): Uint8Array;
}
