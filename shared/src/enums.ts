export enum MentalState {
    CALM = 'CALM',
    PANIC = 'PANIC',
    RAGE = 'RAGE',
    FOCUS = 'FOCUS',
    BREAKDOWN = 'BREAKDOWN'
}

export enum BodyPart {
    HEAD = 'HEAD',
    TORSO = 'TORSO',
    LEFT_ARM = 'LEFT_ARM',
    RIGHT_ARM = 'RIGHT_ARM',
    LEGS = 'LEGS'
}

export enum ActionType {
    IDLE = 'IDLE',
    MOVE = 'MOVE',
    ATTACK = 'ATTACK',
    INTERACT = 'INTERACT',
    COVER = 'COVER',
    RELOAD = 'RELOAD'
}

export enum Direction {
    NONE = "NONE",
    N = "N",
    E = "E",
    S = "S",
    W = "W",
    NE = "NE",
    SE = "SE",
    SW = "SW",
    NW = "NW",
}

export enum TerrainType {
    GRASS = "grass",
    DIRT = "dirt",
    SAND = "sand",
    CLIFF = "cliff",
}

export enum Faction {
    PLAYER = 'PLAYER',
    ENEMY = 'ENEMY',
    NEUTRAL = 'NEUTRAL'
}

export enum ItemTag {
    COVER = 'COVER',
    WEAPON = 'WEAPON',
    CONSUMABLE = 'CONSUMABLE',
    BUILDABLE = 'BUILDABLE'
}

export enum BuildingType {
    BLACKSMITH = 'BLACKSMITH',
    TRAINING_GROUNDS = 'TRAINING_GROUNDS',
    INN = 'INN',
    TOWNHALL = 'TOWNHALL'
}

export enum Rarity {
    COMMON = 'COMMON',
    UNCOMMON = 'UNCOMMON',
    RARE = 'RARE',
    EPIC = 'EPIC',
    LEGENDARY = 'LEGENDARY'
}
