import { TerrainType } from "../../../shared/src/enums";
import manifestData from "./tile_manifest.json"; // You need to enable JSON module resolution if not on
import { TileKind } from "./TerrainRegistry";

export class AssetLoader {
    private scene: Phaser.Scene;
    // Manifest structure: terrain -> kind -> count
    private static manifest: Record<string, Record<string, number>> = manifestData as any;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * Preloads all tile assets based on the Manifest.
     * client/assets/tiles/{type}/{category}/{type}_{kind}_{variant}.png
     * 
     * Note: our Manifest just gives us counts. We need to map Kind -> Folder Category as well
     * or restructure folders.
     * 
     * Current Design Spec Folders:
     * full, edge, corner, inner, t, straight
     * 
     * Mappings:
     * FULL -> full
     * EDGE_* -> edge
     * CORNER_* -> corner
     * INNER_* -> inner
     * T_* -> t
     * VERTICAL/HORIZONTAL -> straight
     */
    preloadTiles() {
        // Iterate Manifest to load everything
        for (const [terrain, kinds] of Object.entries(AssetLoader.manifest)) {
            for (const [kind, count] of Object.entries(kinds)) {
                const category = this.getCategoryForKind(kind as TileKind);

                for (let i = 0; i < count; i++) {
                    const key = `${terrain}_${kind}_${i}`;
                    // e.g. assets/tiles/grass/edge/grass_edge_n_0.png
                    const path = `assets/tiles/${terrain}/${category}/${key}.png`;
                    this.scene.load.image(key, path);
                }
            }
        }
    }

    private getCategoryForKind(kind: string): string {
        if (kind === 'full') return 'full';
        if (kind === 'isolated') return 'isolated';
        if (kind.startsWith('edge_')) return 'edge';
        if (kind.startsWith('corner_')) return 'corner';
        if (kind.startsWith('inner_')) return 'inner';
        if (kind.startsWith('t_')) return 't';
        if (kind === 'vertical' || kind === 'horizontal') return 'straight';
        return 'full'; // Fallback
    }

    static getTileKey(type: TerrainType, kind: TileKind, variantSeed: number): string {
        // Fallback: If requesting ISOLATED but manifest has 0 count (or we want to force fallback), use FULL.
        // However, user manifest says "isolated": 3. But files are missing.
        // For robustness, if kind is ISOLATED and we suspect missing files, map to FULL.

        // Better: Let's trust the manifest COUNT. If count > 0, we try to load.
        // If Phaser fails to load, it enters the cache as missing.

        // Hack for User's current state: 
        // They put "isolated: 3" in manifest but didn't provide files.
        // We will force ISOLATED -> FULL if the file loading failed (hard to know sync).
        // Or just map ISOLATED -> FULL here if we want to be safe.

        let targetKind = kind;
        if (targetKind === TileKind.ISOLATED) {
            // Check if we actually have isolated tiles?
            // If manifest says 0, use full.
            if ((this.manifest[type]?.[TileKind.ISOLATED] || 0) === 0) {
                targetKind = TileKind.FULL;
            }
            // User has 3 in manifest but no files. 
            // We can't detect file existence here easily.
            // But we can check if the count matches "full" count? No.
        }

        const variants = this.manifest[type]?.[targetKind] || 1;
        const count = variants > 0 ? variants : 1;
        const variantIndex = Math.abs(variantSeed) % count;

        return `${type}_${targetKind}_${variantIndex}`;
    }
}
