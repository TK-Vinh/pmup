import { ActionType, BodyPart, Faction, MentalState, BuildingType, Rarity } from './enums';

export interface Vec2 {
    x: number;
    y: number;
}


export interface Vec3 extends Vec2 {
    z: number; // For 2.5D height (jumping, high ground)
}

export interface HeroStats {
    // Base
    strength: number; // STR
    dexterity: number; // DEX (replaces agility)
    intelligence: number; // INT (replaces precision)
    vitality: number; // Keep for HP

    // Mental
    iq: number;
    eq: number;
    mental: number; // Mental resilience
}

// Health Status
export interface HealthStatus {
    hp: number;
    maxHp: number;
    injuries: Record<string, string>; // bodyPart -> severity
    stress: number;
}

export interface HeroState {
    id: string;
    name: string;
    rarity: import('./enums').Rarity; // Use imported Enum or recreate it if imports are tricky here. Ideally import { Rarity } from './enums' at top.
    appearanceSeed: number;
    faction: Faction;
    position: Vec3;
    velocity: Vec2;
    stats: HeroStats;
    health: HealthStatus;
    mentalState: MentalState;
    currentAction: ActionType;
    cooldowns: Record<string, number>; // skillId -> remaining ticks
    equipment: {
        mainHand?: string;
        offHand?: string;
        armor?: string;
    };
}

export interface AIIntent {
    heroId: string;
    type: ActionType;
    targetPos?: Vec3;
    targetId?: string;
    score: number; // Utility score
    reasoning: string; // Debug string: "Seeking cover from Archer"
}

export interface Building {
    id: string;
    type: BuildingType;
    name: string;
    position: Vec2; // Grid coordinates
    level: number;
    assignedWorkers: string[]; // Hero IDs
    slots: number;
}

