import { SeededRNG } from '@pmu/shared/src/utils/SeededRNG';
import { Rarity } from '@pmu/shared/src/enums';

export interface HeroVisualLayers {
    body: string;
    face: string;
    hair: string;
    eyes: string;
    armor: string;
    rarityEffect: string | null;
}

export class HeroAppearanceAssembler {
    // Placeholder assets structure - in a real app these would match file names in assets/heroes/
    private static ASSETS = {
        body: ['body_basic', 'body_strong', 'body_slim'],
        face: ['face_1', 'face_2', 'face_3', 'face_scarred'],
        hair: ['hair_short', 'hair_long', 'hair_messy', 'hair_bald', 'hair_mohawk'],
        eyes: ['eyes_blue', 'eyes_brown', 'eyes_green', 'eyes_red'],
        armor: {
            [Rarity.COMMON]: ['armor_cloth_basic'],
            [Rarity.UNCOMMON]: ['armor_leather_studded'],
            [Rarity.RARE]: ['armor_chainmail'],
            [Rarity.EPIC]: ['armor_plate_decorated'],
            [Rarity.LEGENDARY]: ['armor_golden_mythic']
        }
    };

    /**
     * pure function to assemble hero appearance from seed and rarity.
     */
    public static assemble(heroId: string, appearanceSeed: number, rarity: Rarity): HeroVisualLayers {
        // Initialize RNG with appearance seed
        const rng = new SeededRNG(appearanceSeed);

        // Select layers deterministicly
        const body = rng.pick(this.ASSETS.body);
        const face = rng.pick(this.ASSETS.face);
        const hair = rng.pick(this.ASSETS.hair);
        const eyes = rng.pick(this.ASSETS.eyes);

        // Select armor based on rarity (or maybe mix? for now strict rarity tier)
        const armorOptions = this.ASSETS.armor[rarity] || this.ASSETS.armor[Rarity.COMMON];
        const armor = rng.pick(armorOptions);

        return {
            body: `assets/heroes/body/${body}.png`,
            face: `assets/heroes/face/${face}.png`,
            hair: `assets/heroes/hair/${hair}.png`,
            eyes: `assets/heroes/eyes/${eyes}.png`,
            armor: `assets/heroes/armor/${armor}.png`,
            rarityEffect: rarity === Rarity.LEGENDARY ? 'effect_glow_gold' : null
        };
    }
}

// Example usage call
// const visual = HeroAppearanceAssembler.assemble(hero.id, hero.appearanceSeed, hero.rarity);
// container.add(scene.add.image(0, 0, visual.body));
// container.add(scene.add.image(0, 0, visual.face));
// ...
