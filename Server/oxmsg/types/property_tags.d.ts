import { PropertyType } from "./enums.js";
export declare type PropertyTag = Readonly<{
    id: number;
    type: PropertyType;
}>;
export declare const enum PropertyTagLiterals {
    RecipientStoragePrefix = "__recip_version1.0_#",
    AttachmentStoragePrefix = "__attach_version1.0_#",
    SubStorageStreamPrefix = "__substg1.0_",
    PropertiesStreamName = "__properties_version1.0",
    NameIdStorage = "__nameid_version1.0",
    EntryStream = "__substg1.0_00030102",
    GuidStream = "__substg1.0_00020102",
    StringStream = "__substg1.0_00040102"
}
export declare const PropertyTags: Record<string, PropertyTag>;
export declare type PropertyTagsEnum = typeof PropertyTags[keyof typeof PropertyTags];
