import { IUserRepository, MatchDataDto } from "../repositories/user.repository";

interface SaveMatchInput {
    ticks: number;
}

export class SaveMatchUseCase {
    // Dependency Injection interfejsu repozytorium (SOLID - Dependency Inversion)
    constructor(private userRepository: IUserRepository) {}

    public async execute(input: SaveMatchInput): Promise<void> {
        console.log(`[Clean Arch Use-Case] Uruchamianie biznesowej logiki zapisu meczu.`);
        
        if (input.ticks <= 0) {
            throw new Error("Nie można zapisać pustego meczu.");
        }

        const metrics: MatchDataDto = {
            matchId: Math.random().toString(36).substring(7),
            durationTicks: input.ticks,
            savedAt: new Date()
        };

        await this.userRepository.saveMatchMetrics(metrics);
    }
}