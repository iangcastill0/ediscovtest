import { CFBStorage } from "../cfb_storage";
/**
 * The GUID stream MUST be named "__substg1.0_00020102". It MUST store the property set GUID
 * part of the property name of all named properties in the Message object or any of its subobjects,
 * except for those named properties that have PS_MAPI or PS_PUBLIC_STRINGS, as described in [MSOXPROPS]
 * section 1.3.2, as their property set GUID.
 * The GUIDs are stored in the stream consecutively like an array. If there are multiple named properties
 * that have the same property set GUID, then the GUID is stored only once and all the named
 * properties will refer to it by its index
 */
export declare class GuidStream extends Array<Uint8Array> {
    /**
     * create this object
     * @param storage the storage that contains the PropertyTags.GuidStream
     */
    constructor(storage?: CFBStorage);
    /**
     * writes all the guids as a stream to the storage
     * @param storage
     */
    write(storage: any): void;
}
