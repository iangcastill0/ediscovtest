import { Attachment } from "./attachment.js";
export declare class Attachments extends Array<Attachment> {
    /**
     * Writes the Attachment objects to the given storage and sets all the needed properties
     * @param rootStorage
     * @returns {number} the total size of the written attachment objects and their properties
     */
    writeToStorage(rootStorage: any): number;
    attach(attachment: Attachment): void;
}
