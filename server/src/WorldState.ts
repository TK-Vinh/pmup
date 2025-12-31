import { HeroState, Vec3, HeroStats, Building } from '@pmu/shared/src/types';
import { Faction, MentalState, ActionType, BodyPart } from '@pmu/shared/src/enums';
import { WorldStateSnapshot, ServerMessageType, MsgBuildingDetails } from '@pmu/shared/src/schema'; // Updated import
import * as crypto from 'crypto';
import { BuildingManager } from './BuildingManager';
import { RandomHeroGenerator } from './RandomHeroGenerator';

export class WorldState {
    private heroes: Map<string, HeroState> = new Map();
    private buildings: BuildingManager;
    private tickCount: number = 0;

    constructor() {
        this.buildings = new BuildingManager();
    }

    public createHero(name: string, faction: Faction, pos: Vec3): HeroState {
        const id = crypto.randomUUID();
        const baseStats = this.generateBaseStats();

        const hero: HeroState = {
            id,
            name,
            rarity: 'COMMON' as any, // Import Rarity or cast
            appearanceSeed: 12345,
            faction,
            position: { ...pos },
            velocity: { x: 0, y: 0 },
            stats: baseStats,
            health: {
                hp: 100,
                maxHp: 100,
                injuries: {},
                stress: 0
            },
            mentalState: MentalState.CALM,
            currentAction: ActionType.IDLE,
            cooldowns: {},
            equipment: {}
        };

        this.heroes.set(id, hero);
        return hero;
    }

    // ...



    public removeHero(id: string) {
        this.heroes.delete(id);
    }

    public getHero(id: string) {
        return this.heroes.get(id);
    }

    public update(dt: number) {
        this.tickCount++;

        // Map bounds (must match client grid size)
        const MAP_SIZE = 10;
        const MIN_BOUND = -MAP_SIZE;
        const MAX_BOUND = MAP_SIZE;

        // TODO: AI Logic, Physics, Status Effects
        // Simple AI: Move heroes randomly every 100 ticks
        if (this.tickCount % 100 === 0) {
            this.heroes.forEach(hero => {
                hero.position.x += (Math.random() - 0.5) * 2;
                hero.position.y += (Math.random() - 0.5) * 2;

                // Clamp position to stay within map bounds
                hero.position.x = Math.max(MIN_BOUND, Math.min(MAX_BOUND, hero.position.x));
                hero.position.y = Math.max(MIN_BOUND, Math.min(MAX_BOUND, hero.position.y));
            });
        }
    }

    public getSnapshot(): WorldStateSnapshot {
        return {
            tick: this.tickCount,
            timestamp: Date.now(),
            heroes: Array.from(this.heroes.values()),
            buildings: this.buildings.getAllBuildings()
        };
    }

    // -- Building Logic --

    public getBuildingDetails(buildingId: string): MsgBuildingDetails['payload'] | null {
        // Handle fuzzy ID matching if needed, or exact
        // The Client might send "b_blacksmith_..."
        // But for town buildings, we might want simple IDs or iterate.
        // For now, let's assume we pass the exact ID or find by type if needed?
        // Actually BuildingManager generates IDs. The client needs to know them.
        // We should probably expose buildings in the Snapshot OR a separate layout message.
        // For now, let's just find by ID.

        const building = this.buildings.getBuilding(buildingId);
        if (!building) return null;

        // Populate worker details
        const workerStates = building.assignedWorkers
            .map(id => this.getHero(id))
            .filter((h): h is HeroState => !!h);

        return {
            buildingId: building.id,
            name: building.name,
            type: building.type, // Map enum to string if needed, but shared types match
            level: building.level,
            workers: workerStates,
            slots: building.slots,
            availableActions: ['ENTER', 'UPGRADE'] // Placeholder
        };
    }

    public getAllBuildings(): Building[] {
        return this.buildings.getAllBuildings();
    }

    public hireHeroAtBuilding(buildingId: string): HeroState | null {
        const building = this.buildings.getBuilding(buildingId);
        if (!building) return null;

        // Generate and spawn hero
        const hero = RandomHeroGenerator.generate(building.level);
        hero.position = { ...building.position, z: 0 };

        this.heroes.set(hero.id, hero);
        return hero;
    }

    public moveBuilding(buildingId: string, newPos: { x: number, y: number }): boolean {
        return this.buildings.moveBuilding(buildingId, newPos);
    }

    // -- Helpers --

    private generateBaseStats(): HeroStats {
        return {
            strength: 10,
            dexterity: 10,
            intelligence: 10,
            vitality: 10,
            iq: 5,
            eq: 5,
            mental: 5
        };
    }
}
