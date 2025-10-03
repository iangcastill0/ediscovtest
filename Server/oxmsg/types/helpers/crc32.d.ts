import ByteBuffer from "bytebuffer";
export declare class Crc32 {
    /**
     * calculates a checksum of a ByteBuffers contents
     * @param buffer {ByteBuffer}
     * @returns {number} the crc32 of this buffer's contents between offset and limit
     */
    static calculate(buffer: ByteBuffer): number;
}
