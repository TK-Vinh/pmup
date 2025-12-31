import { TerrainType } from "../../../shared/src/enums";
import { TileKind } from "./TerrainRegistry";

export interface AutoTileResult {
    kind: TileKind;
    variantSeed: number; // For picking a random variant
}

export class TileAutoTiler {

    /**
     * computeTileInfo
     * Calculates the TileKind based on neighbors.
     */
    static computeTileInfo(
        grid: Map<string, TerrainType>,
        x: number,
        y: number,
        currentType: TerrainType
    ): AutoTileResult {
        // 1. Get Neighbors Presence
        const n = grid.get(`${x},${y - 1}`) === currentType;
        const e = grid.get(`${x + 1},${y}`) === currentType;
        const s = grid.get(`${x},${y + 1}`) === currentType;
        const w = grid.get(`${x - 1},${y}`) === currentType;

        // 2. Compute 4-Bit Mask
        // N=1, E=2, S=4, W=8
        // Range 0-15
        const mask = (n ? 1 : 0) | (e ? 2 : 0) | (s ? 4 : 0) | (w ? 8 : 0);

        // 3. Resolve base TileKind from Mask
        let kind = this.maskToKind(mask);

        // 4. Inner Corner Checks
        // Only valid if we are "Full" or "Connected" in a way that allows inner corner.
        // Actually, Inner Corners usually override "Full" or specific Corner configurations.

        // Strategy: High Priority Inner Corner Check.
        // If we have neighbours N and E, but NE is missing -> Inner NE
        // Note: This logic assumes single inner corners. 
        // If multiple are missing (e.g. cross), it's tricky.

        const ne = grid.get(`${x + 1},${y - 1}`) === currentType;
        const se = grid.get(`${x + 1},${y + 1}`) === currentType;
        const sw = grid.get(`${x - 1},${y + 1}`) === currentType;
        const nw = grid.get(`${x - 1},${y - 1}`) === currentType;

        // Check Inner NE
        if (n && e && !ne) kind = TileKind.INNER_NE;
        // Check Inner SE
        else if (s && e && !se) kind = TileKind.INNER_SE;
        // Check Inner SW
        else if (s && w && !sw) kind = TileKind.INNER_SW;
        // Check Inner NW
        else if (n && w && !nw) kind = TileKind.INNER_NW;

        // 5. Generate Seed for Variant
        // Simple deterministic hash
        const variantSeed = (x * 73856093) ^ (y * 19349663);

        return { kind, variantSeed };
    }

    private static maskToKind(mask: number): TileKind {
        switch (mask) {
            case 0: return TileKind.ISOLATED;
            case 1: return TileKind.EDGE_S; // Tip pointing N => South Edge of a block
            case 2: return TileKind.EDGE_W; // Tip pointing E => West Edge
            case 3: return TileKind.CORNER_SW; // N and E present
            case 4: return TileKind.EDGE_N; // Tip pointing S => North Edge
            case 5: return TileKind.VERTICAL;
            case 6: return TileKind.CORNER_NW; // E and S present
            case 7: return TileKind.EDGE_W; // N, E, S present -> West side is "Inner" or "Edge"?
                // Wait, N,E,S present means W is MISSING.
                // So we are the West Edge of the terrain.
                return TileKind.EDGE_W;
            case 8: return TileKind.EDGE_E; // Tip pointing W => East Edge
            case 9: return TileKind.CORNER_SE; // W and N
            case 10: return TileKind.HORIZONTAL;
            case 11: return TileKind.EDGE_S; // N,E,W -> S missing
            case 12: return TileKind.CORNER_NE; // S and W
            case 13: return TileKind.EDGE_E; // N,S,W -> E missing
            case 14: return TileKind.EDGE_N; // E,S,W -> N missing
            case 15: return TileKind.FULL;
            default: return TileKind.ISOLATED;
        }
    }
}
