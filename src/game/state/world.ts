import { PlayerState, PlayerInput } from "../../shared/types";

export class GameWorld {
    public players: Map<number, PlayerState> = new Map();
    private inputQueues: Map<number, PlayerInput[]> = new Map();

    public addPlayer(id: number): void {
        this.players.set(id, {
            id,
            position: { x: 400, y: 300 },
            velocity: { x: 0, y: 0 },
            angle: 0,
            lastProcessedInputSequence: 0
        });
        this.inputQueues.set(id, []);
    }

    public removePlayer(id: number): void {
        this.players.delete(id);
        this.inputQueues.delete(id);
    }

    public queueInput(id: number, input: PlayerInput): void {
        const queue = this.inputQueues.get(id);
        if (queue) {
            // Bezpieczeństwo: Zapobiegamy przepełnieniu kolejki przez cheaterów
            if (queue.length < 30) {
                queue.push(input);
            }
        }
    }

    public getAndClearInputs(id: number): PlayerInput[] {
        const queue = this.inputQueues.get(id) || [];
        this.inputQueues.set(id, []);
        return queue;
    }
}