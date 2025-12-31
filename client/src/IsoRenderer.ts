import type { Vec3, Vec2 } from '@pmu/shared/src/types';

export class IsoRenderer {
    // Configurable tile dimensions
    static readonly TILE_WIDTH = 64;
    static readonly TILE_HEIGHT = 32;

    /**
     * Converts world coordinates (x, y, z) to screen coordinates (px, py).
     * Z acts as height offset (y-axis).
     */
    static worldToScreen(pos: Vec3): Vec2 {
        const screenX = (pos.x - pos.y) * (this.TILE_WIDTH / 2);
        const screenY = (pos.x + pos.y) * (this.TILE_HEIGHT / 2) - (pos.z * this.TILE_HEIGHT);

        return { x: screenX, y: screenY };
    }

    /**
     * Converts screen coordinates to rough world iso coordinates (z=0 assumed).
     */
    static screenToWorld(x: number, y: number): Vec2 {
        const halfW = this.TILE_WIDTH / 2;
        const halfH = this.TILE_HEIGHT / 2;

        const isoY = y / halfH;
        const isoX = x / halfW;

        const mapY = (isoY - isoX) / 2;
        const mapX = (isoY + isoX) / 2;

        return { x: mapX, y: mapY };
    }
}
