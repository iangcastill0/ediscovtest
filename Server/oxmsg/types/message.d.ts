import { CFBStorage } from "./cfb_storage";
import { MessageClass, MessageIconIndex } from "./enums";
import type { PropertyTag } from "./property_tags";
import { TopLevelProperties } from "./streams/top_level_properties";
/**
 * base class for all MSG files
 */
export declare class Message {
    private _saved;
    iconIndex: MessageIconIndex | null;
    protected readonly _topLevelProperties: TopLevelProperties;
    private readonly _namedProperties;
    protected readonly _storage: CFBStorage;
    protected _messageClass: MessageClass;
    protected _messageSize: number;
    constructor();
    _save(): void;
    /**
     * writes the Message to an underlying CFB
     * structure and returns a serialized
     * representation
     *
     */
    saveToBuffer(): Uint8Array;
    addProperty(propertyTag: PropertyTag, value: any, flags?: number): void;
}
