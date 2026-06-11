export interface Vector2D{
    x: number;
    y: number;
}

export interface PlayerInput {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    angle: number;
    sequenceNumber: number;
}

export interface PlayerState {
    id: number;
    position: Vector2D;
    velocity: Vector2D;
    angle: number;
    lastProcessedInputSequence: number;
}

export enum OpCode {
    CLIENT_INPUT = 1,
    SERVER_WORLD_UPDATE = 2,
    SERVER_INIT = 3,
    SERVER_STATS = 4 // <-- NEW: Performance metrics packet
}

export const GAME_CONFIG = {
    TICK_RATE: 60,
    TICK_TIME_MS: 1000 / 60, // ~16.66ms
    PLAYER_SPEED: 300,       // piksele na sekunde
    MAP_WIDTH: 1920,
    MAP_HEIGHT: 1080,
    PLAYER_RADIUS: 20
};