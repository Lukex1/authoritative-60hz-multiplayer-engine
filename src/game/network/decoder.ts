import { PlayerInput, OpCode } from "../../shared/types";

export class BinaryDecoder {
    public static decodeClientInput(buffer: ArrayBuffer): PlayerInput | null {
        const view = new DataView(buffer);
        
        const opCode = view.getUint8(0);
        if (opCode !== OpCode.CLIENT_INPUT) return null;

        const sequenceNumber = view.getUint32(1);
        const inputBitmask = view.getUint8(5);
        const angle = view.getFloat32(6); // 4 bajty

        // Dekodowanie bitmaski kierunków (1 bajt oszczędza masę pasma)
        return {
            sequenceNumber,
            angle,
            up:    (inputBitmask & 0x01) !== 0,
            down:  (inputBitmask & 0x02) !== 0,
            left:  (inputBitmask & 0x04) !== 0,
            right: (inputBitmask & 0x08) !== 0
        };
    }
}