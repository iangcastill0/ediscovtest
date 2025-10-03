import { TopLevelProperties } from "./top_level_properties";
import { PropertyKind, PropertyType } from "../enums";
declare type NamedProperty = {
    nameIdentifier: number;
    kind: PropertyKind;
    nameSize: number;
    name: string;
    guid: Uint8Array;
};
declare type NamedPropertyTag = {
    id: number;
    name: string;
    guid: Uint8Array;
    propertyType: PropertyType;
};
export declare class NamedProperties extends Array<NamedProperty> {
    private readonly _topLevelProperties;
    constructor(topLevelProperties: TopLevelProperties);
    /**
     * adds a NamedPropertyTag. Only support for properties by ID for now.
     * @param mapiTag {NamedProperty}
     * @param obj {any}
     */
    addProperty(mapiTag: NamedPropertyTag, obj: any): void;
    /**
     * Writes the properties to the storage. Unfortunately this is going to have to be used after we already written the top level properties.
     * @param storage {any}
     * @param messageSize {number}
     */
    writeProperties(storage: any, messageSize?: number): void;
    /**
     * generates the stream strings
     * @param nameIdentifier {number} was uint
     * @param guidTarget {number} was uint
     * @param propertyKind {PropertyKind} 1 byte
     */
    static _generateStreamString(nameIdentifier: number, guidTarget: number, propertyKind: PropertyKind): string;
}
export {};
