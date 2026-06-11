import { createServer } from "http";
import * as readline from "readline";
import { GameWorld } from "./game/state/world";
import { GameLoop } from "./game/loop";
import { GameWebSocketServer } from "./infrastructure/websocket/ws-server";
import { PostgresUserRepository } from "./api/repositories/user.repository";
import { SaveMatchUseCase } from "./api/use-cases/save-match";

const world = new GameWorld();

// ==========================================================================
// SYSTEM ANTYKOLIZYJNY (Dynamiczna eksmisja botów przy wejściu gracza)
// ==========================================================================
let botInterval: NodeJS.Timeout | null = null;
const activeBotIds: number[] = [];
const botVelocities = new Map<number, { vx: number; vy: number }>();

// Przechwytujemy oryginalną metodę świata gry
const originalAddPlayer = world.addPlayer.bind(world);

// Nadpisujemy ją inteligentnym filtrem (Monkey Patching)
world.addPlayer = function (id: number) {
    if (activeBotIds.includes(id)) {
        console.log(`[Anti-Collision] Real player joined with ID: ${id}. Automatically evicting Bot ${id} to free up the slot.`);
        
        // 1. Usuń bota z pętli symulacji ruchu
        const index = activeBotIds.indexOf(id);
        if (index > -1) activeBotIds.splice(index, 1);
        botVelocities.delete(id);
        
        // 2. Usuń bota ze świata gry, aby zrobić czyste miejsce dla gracza
        world.removePlayer(id);
    }
    // 3. Wywołaj oryginalną logikę dodawania gracza
    return originalAddPlayer(id);
};

// ==========================================================================
// INICJALIZACJA SERWERA
// ==========================================================================
const httpServer = createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Authoritative Game Server running...");
});

const wsServer = new GameWebSocketServer(httpServer, world);
const userRepository = new PostgresUserRepository();
const saveMatchUseCase = new SaveMatchUseCase(userRepository);

const gameLoop = new GameLoop(
    world,
    (binaryData) => wsServer.broadcast(binaryData),
    async (stats) => {
        try {
            await saveMatchUseCase.execute({ ticks: stats.totalTicks });
        } catch (error) {
            console.error("[Match] Error while saving match:", error);
        }
    }
);

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`[SERVER RUNNING] Server started on port ${PORT}`);
    console.log(`[GAME LOOP] Tick rate set to 60Hz`);
    console.log(`[ADMIN] Commands: list, kick <id>, performance test <count>, performance clear, stop`);
    console.log(`==================================================`);
    gameLoop.start();
});

// Admin Console CLI
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on("line", (input) => {
    const args = input.trim().split(" ");
    const command = args[0].toLowerCase();

    switch (command) {
        case "help":
            console.log(`[Admin] Available commands: list, kick <ID>, performance test <count>, performance clear, stop`);
            break;

        case "list":
            console.log(`[Admin] Active players (${world.players.size}):`);
            for (const [id, player] of world.players) {
                const isBot = activeBotIds.includes(id) ? "[BOT]" : "[HUMAN]";
                console.log(`  -> ID: ${id} ${isBot} | Position: (${Math.round(player.position.x)}, ${Math.round(player.position.y)})`);
            }
            break;

        case "kick":
            const kickId = parseInt(args[1]);
            if (!isNaN(kickId)) {
                wsServer.kickPlayer(kickId);
            } else {
                console.log(`[Admin] Usage: kick <ID>`);
            }
            break;

        case "performance":
            if (args[1] === "test") {
                const count = parseInt(args[2]) || 100;
                console.log(`[Benchmark] Spawning ${count} smooth automated bot players...`);
                
                if (botInterval) {
                    clearInterval(botInterval);
                    for (const botId of activeBotIds) { world.removePlayer(botId); }
                    activeBotIds.length = 0;
                    botVelocities.clear();
                }

                let nextAvailableId = 1;

                for (let i = 0; i < count; i++) {
                    while (world.players.has(nextAvailableId)) {
                        nextAvailableId++;
                    }

                    const botId = nextAvailableId;
                    world.addPlayer(botId);
                    activeBotIds.push(botId);
                    
                    botVelocities.set(botId, {
                        vx: (Math.random() - 0.5) * 6,
                        vy: (Math.random() - 0.5) * 6
                    });

                    const player = world.players.get(botId);
                    if (player) {
                        player.position.x = Math.random() * 1920;
                        player.position.y = Math.random() * 1080;
                    }

                    nextAvailableId++;
                }

                botInterval = setInterval(() => {
                    const MAX_SPEED = 6;
                    const STEERING_FORCE = 0.4;

                    for (const botId of activeBotIds) {
                        const player = world.players.get(botId);
                        const velocity = botVelocities.get(botId);

                        if (player && velocity) {
                            velocity.vx += (Math.random() - 0.5) * STEERING_FORCE;
                            velocity.vy += (Math.random() - 0.5) * STEERING_FORCE;

                            const currentSpeed = Math.sqrt(velocity.vx * velocity.vx + velocity.vy * velocity.vy);
                            if (currentSpeed > MAX_SPEED) {
                                velocity.vx = (velocity.vx / currentSpeed) * MAX_SPEED;
                                velocity.vy = (velocity.vy / currentSpeed) * MAX_SPEED;
                            }

                            player.position.x += velocity.vx;
                            player.position.y += velocity.vy;

                            if (player.position.x < 20) { player.position.x = 20; velocity.vx *= -1; }
                            if (player.position.x > 1900) { player.position.x = 1900; velocity.vx *= -1; }
                            if (player.position.y < 20) { player.position.y = 20; velocity.vy *= -1; }
                            if (player.position.y > 1060) { player.position.y = 1060; velocity.vy *= -1; }
                        }
                    }
                }, 1000 / 60);

                console.log(`[Benchmark] ${count} bots are now wandering smoothly.`);

            } else if (args[1] === "clear") {
                if (botInterval) {
                    clearInterval(botInterval);
                    botInterval = null;
                }
                for (const botId of activeBotIds) {
                    world.removePlayer(botId);
                }
                activeBotIds.length = 0;
                botVelocities.clear();
                console.log(`[Benchmark] All simulated bot players successfully removed.`);
            } else {
                const mem = process.memoryUsage();
                console.log(`[Performance Metrics]`);
                console.log(`  -> RSS Memory: ${(mem.rss / 1024 / 1024).toFixed(2)} MB`);
                console.log(`  -> Heap Used: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`);
                console.log(`  -> Total Entity Count: ${world.players.size}`);
            }
            break;

        case "stop":
            console.log(`[Admin] Stopping server...`);
            gameLoop.stop();
            process.exit(0);
            break;

        default:
            console.log(`[Admin] Unknown command: '${command}'. Type 'help'.`);
    }
});