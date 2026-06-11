import { PlayerState, OpCode } from "../../shared/types";

export class BinaryEncoder {
    public static encodeWorldState(tick: number, players: Map<number, PlayerState>): ArrayBuffer {
        const playerSize = 18;
        const headerSize = 7;
        const bufferSize = headerSize + (players.size * playerSize);
        
        const buffer = new ArrayBuffer(bufferSize);
        const view = new DataView(buffer);

        view.setUint8(0, OpCode.SERVER_WORLD_UPDATE);
        view.setUint32(1, tick);
        view.setUint16(5, players.size);

        let offset = headerSize;
        for (const [_, player] of players) {
            view.setUint16(offset, player.id);
            view.setFloat32(offset + 2, player.position.x);
            view.setFloat32(offset + 6, player.position.y);
            view.setFloat32(offset + 10, player.angle);
            view.setUint32(offset + 14, player.lastProcessedInputSequence);
            offset += playerSize;
        }

        return buffer;
    }
}