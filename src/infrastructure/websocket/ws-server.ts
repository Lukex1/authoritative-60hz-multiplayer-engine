import { WebSocketServer, WebSocket } from "ws";
import { Server as HttpServer } from "http";
import { IncomingMessage } from "http";
import { GameWorld } from "../../game/state/world";
import { BinaryDecoder } from "../../game/network/decoder";
import { OpCode } from "../../shared/types";

export class GameWebSocketServer {
    private wss: WebSocketServer;
    private clients: Map<number, WebSocket> = new Map();
    private disconnectTimeouts: Map<number, NodeJS.Timeout> = new Map();
    
    // For CPU tracking
    private lastCpuUsage = process.cpuUsage();
    private lastCpuTime = process.hrtime.bigint();

    constructor(server: HttpServer, private world: GameWorld) {
        this.wss = new WebSocketServer({ server });
        this.init();
        this.startMetricsBroadcasting();
    }

    private init(): void {
        this.wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
            ws.binaryType = "arraybuffer";

            const urlParams = new URLSearchParams(req.url?.split('?')[1]);
            const reconnectIdStr = urlParams.get("playerId");
            let id: number;

            if (reconnectIdStr && this.world.players.has(parseInt(reconnectIdStr))) {
                id = parseInt(reconnectIdStr);
                const timeout = this.disconnectTimeouts.get(id);
                if (timeout) {
                    clearTimeout(timeout);
                    this.disconnectTimeouts.delete(id);
                    console.log(`[Network] Player ${id} successfully reconnected.`);
                }
            } else {
                // ID REUSE LOGIC: Find the lowest available ID starting from 1
                let candidateId = 1;
                while (this.world.players.has(candidateId) || this.clients.has(candidateId)) {
                    candidateId++;
                }
                id = candidateId;
                this.world.addPlayer(id);
                console.log(`[Network] New player joined. Assigned vacant ID: ${id}`);
            }

            this.clients.set(id, ws);

            // Send INIT packet
            const initBuffer = new ArrayBuffer(3);
            const initView = new DataView(initBuffer);
            initView.setUint8(0, OpCode.SERVER_INIT);
            initView.setUint16(1, id);
            ws.send(initBuffer);

            ws.on("message", (message: ArrayBuffer) => {
                try {
                    const input = BinaryDecoder.decodeClientInput(message);
                    if (input) this.world.queueInput(id, input);
                } catch (err) {
                    console.error(`[Network] Packet error from player ${id}:`, err);
                }
            });

            ws.on("close", (code) => {
                this.clients.delete(id);
                
                // If kicked by admin (code 1008), delete immediately, do not wait for reconnect
                if (code === 1008) {
                    this.world.removePlayer(id);
                    return;
                }

                console.log(`[Network] Player ${id} disconnected. Waiting 4s for reconnection...`);
                const timeout = setTimeout(() => {
                    this.world.removePlayer(id);
                    this.disconnectTimeouts.delete(id);
                    console.log(`[Network] Grace period expired. Player ${id} permanently removed.`);
                }, 4000);

                this.disconnectTimeouts.set(id, timeout);
            });
        });
    }

    public kickPlayer(id: number, reason: string = "Kicked by Administrator"): void {
        const client = this.clients.get(id);
        if (client) {
            // 1008 = Policy Violation (Standard WebSocket code for kicks/bans)
            client.close(1008, reason); 
            this.clients.delete(id);
            this.world.removePlayer(id);
            
            const timeout = this.disconnectTimeouts.get(id);
            if (timeout) {
                clearTimeout(timeout);
                this.disconnectTimeouts.delete(id);
            }
            console.log(`[Admin] Player ${id} has been forcefully kicked. Reason: ${reason}`);
        } else {
            console.log(`[Admin] Error: Active player with ID ${id} not found.`);
        }
    }

    public broadcast(data: ArrayBuffer): void {
        for (const [_, client] of this.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        }
    }

    // High-performance binary metrics broadcasting (1Hz)
    private startMetricsBroadcasting(): void {
        setInterval(() => {
            if (this.clients.size === 0) return;

            // 1. Calculate CPU percentage
            const elapCpuUsage = process.cpuUsage(this.lastCpuUsage);
            const elapTime = process.hrtime.bigint() - this.lastCpuTime;
            this.lastCpuUsage = process.cpuUsage();
            this.lastCpuTime = process.hrtime.bigint();

            const cpuUserMs = elapCpuUsage.user / 1000;
            const cpuSysMs = elapCpuUsage.system / 1000;
            const elapTimeMs = Number(elapTime) / 1000000;
            const cpuPercent = Math.min(100, Math.round(((cpuUserMs + cpuSysMs) / elapTimeMs) * 100));

            // 2. Get RAM usage (RSS - Resident Set Size)
            const memoryMb = Math.round(process.memoryUsage().rss / 1024 / 1024);

            // 3. Build Binary Packet (OpCode + CPU[1B] + RAM[2B])
            const buffer = new ArrayBuffer(4);
            const view = new DataView(buffer);
            view.setUint8(0, OpCode.SERVER_STATS);
            view.setUint8(1, cpuPercent);
            view.setUint16(2, memoryMb);

            this.broadcast(buffer);
        }, 1000);
    }
}