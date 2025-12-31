import { TerrainType } from "../../../shared/src/enums";

import { IsoRenderer } from "../IsoRenderer";
import { AutoTileResolver } from "./AutoTileResolver";
import { AssetLoader } from "./AssetLoader";


export class ClientMapManager {
    private grid: Map<string, TerrainType> = new Map();
    private tilesprites: Map<string, Phaser.GameObjects.GameObject> = new Map();
    private scene: Phaser.Scene;
    private mapWidth: number = 20;
    private mapHeight: number = 20;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        // Default initialization (can be overridden by map load)
        this.initializeMap();
    }

    private initializeMap() {
        // Initialize map to match grid size (radius 10 -> -10 to 10)
        for (let x = -this.mapWidth / 2; x <= this.mapWidth / 2; x++) {
            for (let y = -this.mapHeight / 2; y <= this.mapHeight / 2; y++) {
                const key = `${x},${y}`;

                let type = TerrainType.GRASS;

                // Pattern: Central Dirt Road with some noise
                // Crossroads at 0,0
                if (Math.abs(x) <= 1 || Math.abs(y) <= 1) {
                    type = TerrainType.DIRT;
                }

                // Add some random patches to test corners
                if (Math.random() > 0.85) {
                    type = (type === TerrainType.GRASS) ? TerrainType.DIRT : TerrainType.GRASS;
                }

                this.grid.set(key, type);
            }
        }
    }


    /**
     * Renders the entire map.
     * Clears existing tiles and rebuilds. 
     * Optimization: In a real game, use chunks or object pooling.
     */
    render() {
        // Clear old sprites
        this.tilesprites.forEach(sprite => sprite.destroy());
        this.tilesprites.clear();

        const centerOffsetX = 400; // Matches GameScene
        const centerOffsetY = 300;

        // Convert to array for sorting
        const keys = Array.from(this.grid.keys());

        keys.forEach(key => {
            const parts = key.split(',').map(Number);
            const x = parts[0];
            const y = parts[1];
            const type = this.grid.get(key)!;

            // 1. Compute Tile Info using new Resolver
            const result = AutoTileResolver.resolveCell(this.grid, x, y, type);

            // 2. Base Tile
            let textureKey = result.base.key;

            // Fallback for Base
            if (!this.scene.textures.exists(textureKey)) {
                const fallbackKey = AssetLoader.getTileKey(type, 'full' as any, result.base.variantSeed);
                if (this.scene.textures.exists(fallbackKey)) {
                    textureKey = fallbackKey;
                } else {
                    // console.warn(`Missing base: ${textureKey}`);
                }
            }

            // 4. Position (Center)
            const pos = IsoRenderer.worldToScreen({ x: x + 0.5, y: y + 0.5, z: 0 });
            const screenX = pos.x + centerOffsetX;
            const screenY = pos.y + centerOffsetY;

            // 5. Create Container
            const container = this.scene.add.container(screenX, screenY);

            // 6. Base Sprite
            const baseSprite = this.scene.add.image(0, 0, textureKey);
            baseSprite.setRotation(Math.PI / 4);
            baseSprite.setScale(1.414);
            container.add(baseSprite);

            // 7. Overlay Sprite (if exists)
            if (result.overlay) {
                let overlayKey = result.overlay.key;
                // Fallback check for overlay
                if (this.scene.textures.exists(overlayKey)) {
                    const overlaySprite = this.scene.add.image(0, 0, overlayKey);
                    overlaySprite.setRotation(Math.PI / 4);
                    overlaySprite.setScale(1.414);
                    container.add(overlaySprite);
                }
            }

            // Squash container for Iso
            container.setScale(1, 0.5);
            container.setDepth(screenY - 1000);

            this.tilesprites.set(key, container as any);
        });
    }

    getTerrain(x: number, y: number): TerrainType | undefined {
        return this.grid.get(`${x},${y}`);
    }
}
