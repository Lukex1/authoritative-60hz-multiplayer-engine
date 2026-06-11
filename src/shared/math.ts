import { Vector2D } from "./types";

export class GameMath{
    public static clamp(val: number, min: number, max: number): number{
        return Math.max(min, Math.min(max, val));
    }

    public static normalize(vec: Vector2D): Vector2D{
        const length = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
        if (length === 0){
            return {x: 0, y:0};
        }
        return { x: vec.x / length, y: vec.y / length };
    }
}