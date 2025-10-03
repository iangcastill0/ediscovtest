import { AttachmentType } from "./enums.js";
import { CFBStorage } from "./cfb_storage";
export declare class Attachment {
    readonly data: Uint8Array;
    readonly fileName: string;
    readonly type: AttachmentType;
    readonly contentId: string;
    readonly renderingPosition: number;
    readonly isContactPhoto: boolean;
    constructor(data: Uint8Array, // was: Stream
    fileName: string, contentId?: string, type?: AttachmentType, renderingPosition?: number, isContactPhoto?: boolean);
    writeProperties(storage: CFBStorage, index: number): number;
}
