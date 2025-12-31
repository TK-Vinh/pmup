import { Building } from '@pmu/shared/src/types';
import { BuildingType } from '@pmu/shared/src/enums';
import { Vec2 } from '@pmu/shared/src/types';

export class BuildingManager {
    private buildings: Map<string, Building> = new Map();

    constructor() {
        this.initializeTown();
    }

    private initializeTown() {
        // Hardcoded town layout for 2.5D map
        this.createBuilding(BuildingType.BLACKSMITH, 'The Anvil', { x: 2, y: 2 });
        this.createBuilding(BuildingType.TRAINING_GROUNDS, 'Barracks', { x: -2, y: 2 });
        this.createBuilding(BuildingType.INN, 'Golden Tankard', { x: 0, y: -3 });
        this.createBuilding(BuildingType.TOWNHALL, 'Town Hall', { x: 0, y: 0 });
    }

    public createBuilding(type: BuildingType, name: string, position: Vec2): Building {
        const id = `b_${type.toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const building: Building = {
            id,
            type,
            name,
            position,
            level: 1,
            assignedWorkers: [],
            slots: 3
        };
        this.buildings.set(id, building);
        return building;
    }

    public getBuilding(id: string): Building | undefined {
        return this.buildings.get(id);
    }

    public getAllBuildings(): Building[] {
        return Array.from(this.buildings.values());
    }

    public assignWorker(buildingId: string, workerId: string): boolean {
        const building = this.buildings.get(buildingId);
        if (!building) return false;
        if (building.assignedWorkers.length >= building.slots) return false;

        building.assignedWorkers.push(workerId);
        return true;
    }

    public moveBuilding(buildingId: string, newPos: Vec2): boolean {
        const building = this.buildings.get(buildingId);
        if (!building) return false;

        // Simple bound check (optional, matching client grid)
        if (Math.abs(newPos.x) > 10 || Math.abs(newPos.y) > 10) return false;

        // Check for collision with valid 2x2 blocking
        // We assume each building occupies a 2x2 tile space or requires 2 tile spacing
        // Condition: overlapping if dx < 2 AND dy < 2
        for (const other of this.buildings.values()) {
            if (other.id === buildingId) continue;

            const dx = Math.abs(other.position.x - newPos.x);
            const dy = Math.abs(other.position.y - newPos.y);

            if (dx < 2 && dy < 2) {
                console.log(`Move blocked: Collision with ${other.name} at ${JSON.stringify(other.position)}`);
                return false;
            }
        }

        building.position = newPos;
        return true;
    }
}
