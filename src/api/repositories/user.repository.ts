export interface MatchDataDto {
    matchId: string;
    durationTicks: number;
    savedAt: Date;
}

export interface IUserRepository {
    saveMatchMetrics(data: MatchDataDto): Promise<boolean>;
}

// Implementacja udająca bazę danych dla kompletności wzorca projektowego
export class PostgresUserRepository implements IUserRepository {
    public async saveMatchMetrics(data: MatchDataDto): Promise<boolean> {
        console.log(`[DB Infrastructure] Zapisywanie danych meczu ${data.matchId} do bazy PostgreSQL...`);
        // Tutaj znajdowałby się kod np. Prisma: await this.prisma.match.create({ data })
        return true;
    }
}