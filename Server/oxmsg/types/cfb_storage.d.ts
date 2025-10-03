import type { CFB$Container } from "cfb";
/**
 * wrapper around SheetJS CFB to produce FAT-like compound file
 * terminology:
 * 'storage': directory in the cfb
 * 'stream' : file in the cfb
 * */
export declare class CFBStorage {
    /** underlying cfb container */
    _cfb: CFB$Container;
    /** the current path all new storages and streams will be added to*/
    _path: string;
    constructor(cfb?: CFB$Container);
    /**
     * add substorage to this (doesn't modify the underlying CFBContainer)
     * @param name {string} name of the subdir
     * @returns {CFBStorage} a storage that will add storage and streams to the subdir
     * */
    addStorage(name: string): CFBStorage;
    /**
     *
     */
    getStorage(name: string): CFBStorage;
    /**
     * add a stream (file) to the cfb at the current _path. creates all parent dirs if they don't exist yet
     * should the stream already exist, this will replace the contents.
     * @param name {string} the name of the new stream
     * @param content {Uint8Array} the contents of the stream
     * @return {void}
     * */
    addStream(name: string, content: Uint8Array): void;
    /**
     * get the contents of a stream or an empty array
     * @param name {string} the name of the stream
     * @return {Uint8Array} the contents of the named stream, empty if it wasn't found
     * TODO: should this be absolute?
     */
    getStream(name: string): Uint8Array;
    /** write the contents of the cfb container to a byte array */
    toBytes(): Uint8Array;
    _getEntryIndex(name: string): number;
}
