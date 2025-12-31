import { TerrainType } from "../../../shared/src/enums";
import { TileKind, MASK_TO_KIND } from "./tileRules";
import { AssetLoader } from "./AssetLoader";

// Terrain Hierarchy: Higher number = Higher Layer
const TERRAIN_TIER: Record<TerrainType, number> = {
    [TerrainType.GRASS]: 0,
    [TerrainType.DIRT]: 1,
    [TerrainType.SAND]: 2,
    [TerrainType.CLIFF]: 99 // Special
};

export interface TileInfo {
    key: string;
    kind: TileKind;
    variantSeed: number;
}

export interface ResolvedTile {
    base: TileInfo;
    overlay?: TileInfo;
}

export class AutoTileResolver {

    static resolveCell(
        grid: Map<string, TerrainType>,
        x: number,
        y: number,
        type: TerrainType
    ): ResolvedTile {
        const variantSeed = (x * 73856093) ^ (y * 19349663);

        // 1. Resolve Base Layer
        const baseMask = this.computeBaseMask(grid, x, y, type);
        const baseKind = MASK_TO_KIND[baseMask] || TileKind.FULL;
        const baseKey = AssetLoader.getTileKey(type, baseKind, variantSeed);

        const result: ResolvedTile = {
            base: { key: baseKey, kind: baseKind, variantSeed }
        };

        // 2. Resolve Overlay Layer
        // Check 4 neighbors. If any neighbor is ONE TIER HIGHER, we need an overlay of that tier.
        // Rule: sand overlays dirt; dirt overlays grass.
        // This implies we check specific pairs.
        // Or generic "Higher Tier Overlay".

        // Let's check for the "dominant" higher tier neighbor.
        // Assuming only 1 level of overlay per cell for simplicity (as per prompt "2 layers").

        const myTier = TERRAIN_TIER[type];

        // Check neighbors for higher tier
        const n = this.getTerrain(grid, x, y - 1);
        const e = this.getTerrain(grid, x + 1, y);
        const s = this.getTerrain(grid, x, y + 1);
        const w = this.getTerrain(grid, x - 1, y);

        // Find highest tier among neighbors that is > myTier
        let overlayTier = -1;
        let overlayType: TerrainType | null = null;

        [n, e, s, w].forEach(t => {
            if (!t) return;
            const tier = TERRAIN_TIER[t];
            if (tier > myTier && tier > overlayTier) {
                overlayTier = tier;
                overlayType = t;
            }
        });

        if (overlayType) {
            // Compute mask for this overlay type relative to current cell
            // We want the overlay tile to represent the "Edge" of the Higher Terrain encroaching onto us.
            // But usually, standard autotiling works by drawing the HIGHER terrain's border.
            // If I am Grass(0) and N is Dirt(1).
            // Dirt needs to draw its "South Edge" on me? 
            // OR I draw a "North Edge" of Dirt on myself?

            // Standard Approach:
            // visual = HigherTerrain tile with mask reflecting connection to HigherTerrain neighbors.
            // If N is Dirt, E is Grass.
            // Overlay Mask for Dirt check at center (me):
            // N=Dirt (1), E=Grass (0), S=Grass (0), W=Grass (0).
            // Mask = 1 (North).
            // Tile Kind = EDGE_N.
            // So we draw specific Dirt Tile EDGE_N on top of Grass.
            // This looks like Dirt is spilling from North. Correct.

            const overlayMask = this.computeOverlayMask(grid, x, y, overlayType);
            const overlayKind = MASK_TO_KIND[overlayMask];

            // Only render overlay if mask > 0 (it is connected to actual higher ground)
            // and usually we don't render FULL overlay (mask 15) because that means we are surrounded 
            // which contradicts us being lower tier? 
            // Actually if we are completely surrounded by higher tier, we might be a hole?
            // If mask is 15 (FULL), we are hidden? Or we are a "lake" of lower tier?
            // If we are Grass surrounded by Dirt, overlaying Dirt FULL on us would hide us. 
            // In typical RPG Maker, "Layer 2" is transparent except edges. 
            // BUT our "Full" tiles are solid.
            // Our "Edge" tiles... are they transparent? The user asset naming implies standard blobs.
            // Standard blobs usually have "Edge" tiles that are mostly solid?
            // User Prompt: "overlay dirt edge". 
            // If assets are "grass_edge_n", it implies Grass is the solid part, and the rest is transparent?
            // NO. Usually "grass_edge_n" means "Grass is Main, Edge is to North".
            // WAIT. 
            // If "grass_edge_n" image has Grass on South and Transparency on North?
            // OR Grass on North and Transparency on South?

            // Let's assume standard "Blob" (Wang/Autotile):
            // "Edge N" usually means the boundary is to the North. The tile content is Grass.

            // IF we use Overlay Layer strategy:
            // "Overlay dirt edge" means we draw a Dirt tile that has a transparent "interior"?
            // OR we draw a Dirt tile that is solid Dirt, but cut to look like an edge?

            // Let's assume the "Edge" tiles in the asset pack are designed for this overlaying.
            // e.g. "dirt_edge_n.png" -> Has Dirt on Top, Transparent on Bottom?
            // If so, putting it on Grass makes it look like Dirt boundary.

            // So: Compute Mask for OverlayType.
            if (overlayKind && overlayKind !== TileKind.ISOLATED) {
                const overlayKey = AssetLoader.getTileKey(overlayType, overlayKind, variantSeed);
                result.overlay = { key: overlayKey, kind: overlayKind, variantSeed };
            }
        }

        return result;
    }

    private static computeBaseMask(grid: Map<string, TerrainType>, x: number, y: number, myType: TerrainType): number {
        const myTier = TERRAIN_TIER[myType];

        let mask = 0;
        if (this.isBaseConnected(grid, x, y - 1, myTier)) mask += 1; // N
        if (this.isBaseConnected(grid, x + 1, y, myTier)) mask += 2; // E
        if (this.isBaseConnected(grid, x, y + 1, myTier)) mask += 4; // S
        if (this.isBaseConnected(grid, x - 1, y, myTier)) mask += 8; // W
        return mask;
    }

    // For Base Layer: Connect to SAME or HIGHER tier. (Lower tier is "Empty/Edge")
    private static isBaseConnected(grid: Map<string, TerrainType>, tx: number, ty: number, myTier: number): boolean {
        const t = this.getTerrain(grid, tx, ty);
        if (!t) return false; // Void is not connected
        const theirTier = TERRAIN_TIER[t];
        return theirTier >= myTier;
    }

    private static computeOverlayMask(grid: Map<string, TerrainType>, x: number, y: number, overlayType: TerrainType): number {
        const targetTier = TERRAIN_TIER[overlayType];

        let mask = 0;
        // For Overlay: Connect ONLY to Higher/Same Tier (The tier we are overlaying)
        if (this.isOverlayConnected(grid, x, y - 1, targetTier)) mask += 1;
        if (this.isOverlayConnected(grid, x + 1, y, targetTier)) mask += 2;
        if (this.isOverlayConnected(grid, x, y + 1, targetTier)) mask += 4;
        if (this.isOverlayConnected(grid, x - 1, y, targetTier)) mask += 8;
        return mask;
    }

    private static isOverlayConnected(grid: Map<string, TerrainType>, tx: number, ty: number, targetTier: number): boolean {
        const t = this.getTerrain(grid, tx, ty);
        if (!t) return false;
        // We connect if neighbor is THIS overlay type or even higher?
        // Usually just "Is it the overlay type?"
        // Simplicity: >= targetTier
        const theirTier = TERRAIN_TIER[t];
        return theirTier >= targetTier;
    }

    private static getTerrain(grid: Map<string, TerrainType>, x: number, y: number): TerrainType | undefined {
        return grid.get(`${x},${y}`);
    }
}
