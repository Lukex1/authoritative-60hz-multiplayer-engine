import { GameWorld } from "./state/world";
import { PhysicsEngine } from "./engine/physics";
import { BinaryEncoder } from "./network/encoder";
import { GAME_CONFIG } from "../shared/types";

export class GameLoop {
    private tickCount = 0;
    private running = false;
    private lastTickTime: bigint = process.hrtime.bigint();
    
    constructor(
        private world: GameWorld,
        private broadcastCallback: (data: ArrayBuffer) => void,
        private onMatchEnd: (stats: { totalTicks: number }) => void
    ) {}

    public start(): void {
        this.running = true;
        this.lastTickTime = process.hrtime.bigint();
        this.tick();
    }

    private tick = (): void => {
        if (!this.running) return;

        const now = process.hrtime.bigint();
        // Konwersja nanosekund z hrtime do sekund (Float)
        const deltaTime = Number(now - this.lastTickTime) / 1_000_000_000;
        
        this.lastTickTime = now;
        this.tickCount++;

        // Przetwarzanie wejść graczy (Input Handling)
        for (const [id, player] of this.world.players) {
            const inputs = this.world.getAndClearInputs(id);
            for (const input of inputs) {
                PhysicsEngine.updatePlayer(player, input, deltaTime);
            }
        }

        // Pakowanie świata do binarnego bufora
        const encodedState = BinaryEncoder.encodeWorldState(this.tickCount, this.world.players);
        this.broadcastCallback(encodedState);

        // Wyzwalacz zakończenia meczu w celach demonstracji Clean Architecture
        if (this.tickCount === 216000) { // Po 1 godzinie gry przy 60Hz
            this.stop();
            this.onMatchEnd({ totalTicks: this.tickCount });
            return;
        }

        // Precyzyjne planowanie kolejnego ticku uwzględniające czas wykonania obliczeń
        const elapsedMs = Number(process.hrtime.bigint() - now) / 1_000_000;
        const nextTickDelay = Math.max(0, GAME_CONFIG.TICK_TIME_MS - elapsedMs);

        setTimeout(this.tick, nextTickDelay);
    };

    public stop(): void {
        this.running = false;
    }
}