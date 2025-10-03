import { PropertyTagsEnum } from "./property_tags.js";
import { PropertyType } from "./enums.js";
import { Property } from "./property.js";
import ByteBuffer from "bytebuffer";
import type { CFBStorage } from "./cfb_storage.js";
export declare class Properties extends Array<Property> {
    /**
     * add a prop it it doesn't exist, otherwise replace it
     */
    addOrReplaceProperty(tag: PropertyTagsEnum, obj: any, flags?: number): void;
    _expectPropertyType(expected: PropertyType, actual: PropertyType): void;
    addDateProperty(tag: PropertyTagsEnum, value: Date, flags?: number): void;
    addBinaryProperty(tag: PropertyTagsEnum, data: Uint8Array, flags?: number): void;
    _addProperty(tag: PropertyTagsEnum, value: any, flags: number): void;
    /**
     * @deprecated use typed addPropertyFunctions instead (or make one if it doesn't exist). replace this method with _addProperty and only use it internally
     * @param tag
     * @param value
     * @param flags
     */
    addProperty(tag: PropertyTagsEnum, value: any, flags?: number): void;
    /**
     * writes the properties structure to a cfb stream in storage
     * @param storage
     * @param prefix a function that will be called with the buffer before the properties get written to it.
     * @param messageSize
     * @returns {number}
     */
    writeProperties(storage: CFBStorage, prefix: (buffer: ByteBuffer) => void, messageSize?: number): number;
}
