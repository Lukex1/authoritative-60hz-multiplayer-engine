import { PlayerState, PlayerInput, GAME_CONFIG } from "../../shared/types";
import { GameMath } from "../../shared/math";

export class PhysicsEngine {
    public static updatePlayer(player: PlayerState, input: PlayerInput, deltaTime: number): void {
        let moveX = 0;
        let moveY = 0;

        if (input.up)    moveY -= 1;
        if (input.down)  moveY += 1;
        if (input.left)  moveX -= 1;
        if (input.right) moveX += 1;

        // Normalizacja wektora ruchu dla poruszania się po skosie (zapobiega przyspieszeniu)
        const length = Math.sqrt(moveX * moveX + moveY * moveY);
        if (length > 0) {
            moveX /= length;
            moveY /= length;
        }

        // Nowa pozycja: $x_t = x_{t-1} + v \cdot \Delta t$
        player.position.x += moveX * GAME_CONFIG.PLAYER_SPEED * deltaTime;
        player.position.y += moveY * GAME_CONFIG.PLAYER_SPEED * deltaTime;
        player.angle = input.angle;

        // Autorytatywne sprawdzanie kolizji z granicami mapy
        const minX = GAME_CONFIG.PLAYER_RADIUS;
        const maxX = GAME_CONFIG.MAP_WIDTH - GAME_CONFIG.PLAYER_RADIUS;
        const minY = GAME_CONFIG.PLAYER_RADIUS;
        const maxY = GAME_CONFIG.MAP_HEIGHT - GAME_CONFIG.PLAYER_RADIUS;

        player.position.x = GameMath.clamp(player.position.x, minX, maxX);
        player.position.y = GameMath.clamp(player.position.y, minY, maxY);
        
        player.lastProcessedInputSequence = input.sequenceNumber;
    }
}