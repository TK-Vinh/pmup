import type { ActionType, BuildingType } from './enums';
import type { HeroState, Vec3, Building } from './types';

export enum ServerMessageType {
    STATE_SNAPSHOT = 'STATE_SNAPSHOT',
    HERO_SPAWNED = 'HERO_SPAWNED',
    HERO_REMOVED = 'HERO_REMOVED',
    DEBUG_LOG = 'DEBUG_LOG',
    BUILDING_DETAILS = 'BUILDING_DETAILS'
}

export enum ClientMessageType {
    PLAYER_INTENT = 'PLAYER_INTENT',
    ADMIN_COMMAND = 'ADMIN_COMMAND',
    BUILDING_INSPECT = 'BUILDING_INSPECT',
    CRAFT_ITEM = 'CRAFT_ITEM',
    HIRE_HERO = 'HIRE_HERO',
    BUILDING_MOVE = 'BUILDING_MOVE'
}

// -- Server to Client --

export interface WorldStateSnapshot {
    tick: number;
    timestamp: number;
    heroes: HeroState[];
    buildings: Building[];
}

export interface ServerMessage {
    type: ServerMessageType;
    payload: any;
}

export interface MsgStateSnapshot extends ServerMessage {
    type: ServerMessageType.STATE_SNAPSHOT;
    payload: WorldStateSnapshot;
}

export interface MsgBuildingDetails extends ServerMessage {
    type: ServerMessageType.BUILDING_DETAILS;
    payload: {
        buildingId: string;
        name: string;
        type: BuildingType;
        level: number;
        workers: HeroState[]; // Detailed hero info for UI
        slots: number;
        availableActions: string[];
    };
}

// -- Client to Server --

export interface ClientMessage {
    type: ClientMessageType;
    payload: any;
}

export interface MsgPlayerIntent extends ClientMessage {
    type: ClientMessageType.PLAYER_INTENT;
    payload: {
        heroId: string;
        targetPos?: Vec3;
        action: ActionType;
    };
}

export interface MsgBuildingInspect extends ClientMessage {
    type: ClientMessageType.BUILDING_INSPECT;
    payload: {
        buildingId: string; // building ID
    };
}

export interface MsgCraftItem extends ClientMessage {
    type: ClientMessageType.CRAFT_ITEM;
    payload: {
        buildingId: string;
        workerId: string;
        itemType: string;
    };
}

export interface MsgHireHero extends ClientMessage {
    type: ClientMessageType.HIRE_HERO;
    payload: {
        buildingId: string;
    };
}

export interface MsgBuildingMove extends ClientMessage {
    type: ClientMessageType.BUILDING_MOVE;
    payload: {
        buildingId: string;
        position: { x: number; y: number };
    };
}
