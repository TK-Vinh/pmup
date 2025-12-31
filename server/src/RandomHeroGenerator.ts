import { HeroState, HeroStats, Vec3 } from '@pmu/shared/src/types';
import { Faction, MentalState, ActionType, Rarity } from '@pmu/shared/src/enums';
import { SeededRNG } from '@pmu/shared/src/utils/SeededRNG';
import * as crypto from 'crypto';

export class RandomHeroGenerator {
    private static NAMES = ['Aelith', 'Brim', 'Caelum', 'Dorn', 'Elara', 'Fintan', 'Grom', 'Hera', 'Iorveth', 'Jinx', 'Kael', 'Lira', 'Morn', 'Nyx', 'Orin', 'Pryna', 'Quint', 'Riven', 'Sylas', 'Thorne'];

    // Rarity weights (Common to Legendary)
    private static RARITY_WEIGHTS = {
        [Rarity.COMMON]: 60,
        [Rarity.UNCOMMON]: 25,
        [Rarity.RARE]: 10,
        [Rarity.EPIC]: 4,
        [Rarity.LEGENDARY]: 1
    };

    // Stat ranges per rarity (min, max per stat)
    private static RARITY_MODIFIERS = {
        [Rarity.COMMON]: { min: 5, max: 10, budget: 30 },
        [Rarity.UNCOMMON]: { min: 8, max: 14, budget: 45 },
        [Rarity.RARE]: { min: 12, max: 18, budget: 60 },
        [Rarity.EPIC]: { min: 16, max: 24, budget: 80 },
        [Rarity.LEGENDARY]: { min: 22, max: 30, budget: 100 }
    };

    /**
     * Generates a deterministic hero based on playerId (or random ID logic).
     * @param level Level of the building/hero
     * @param playerId Optional player ID to seed generation. If not provided, uses random.
     */
    public static generate(level: number = 1, playerId: string = 'system'): HeroState {
        const timestamp = Date.now();
        const seedInput = `${playerId}_${timestamp}_${level}`;
        const rng = new SeededRNG(seedInput);

        const id = crypto.randomUUID();
        const rarity = this.rollRarity(rng);
        const stats = this.rollStats(rng, rarity, level);
        const appearanceSeed = rng.nextInt(0, 999999);

        return {
            id,
            name: this.getRandomName(rng),
            rarity,
            appearanceSeed,
            faction: Faction.PLAYER,
            position: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0 },
            stats,
            health: {
                hp: 100 + stats.vitality * 5,
                maxHp: 100 + stats.vitality * 5,
                injuries: {},
                stress: 0
            },
            mentalState: MentalState.CALM,
            currentAction: ActionType.IDLE,
            cooldowns: {},
            equipment: {}
        };
    }

    private static rollRarity(rng: SeededRNG): Rarity {
        const roll = rng.nextInt(1, 100);
        let cumulative = 0;

        // Order matters: match WEIGHTS definition order if iterating, explicitly checking here
        if (roll <= 60) return Rarity.COMMON;
        if (roll <= 85) return Rarity.UNCOMMON;
        if (roll <= 95) return Rarity.RARE;
        if (roll <= 99) return Rarity.EPIC;
        return Rarity.LEGENDARY;
    }

    private static rollStats(rng: SeededRNG, rarity: Rarity, level: number): HeroStats {
        const config = this.RARITY_MODIFIERS[rarity];

        // Base stats
        const str = rng.nextInt(config.min, config.max);
        const dex = rng.nextInt(config.min, config.max);
        const int = rng.nextInt(config.min, config.max);
        const vit = rng.nextInt(config.min, config.max);

        // Mental stats (0-20 scale usually?)
        const iq = rng.nextInt(1, 10) + (level > 5 ? 2 : 0);
        const eq = rng.nextInt(1, 10);
        const mental = rng.nextInt(1, 10) + Math.floor(level / 2);

        return {
            strength: str,
            dexterity: dex,
            intelligence: int,
            vitality: vit,
            iq,
            eq,
            mental
        };
    }

    private static getRandomName(rng: SeededRNG): string {
        return rng.pick(this.NAMES);
    }
}
