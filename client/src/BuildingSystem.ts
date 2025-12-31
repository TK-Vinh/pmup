import Phaser from 'phaser';
import { NetworkManager } from './NetworkManager';
import { IsoRenderer } from './IsoRenderer';
import { ClientMessageType } from '@pmu/shared/src/schema'; // Import enum as value
import type { MsgBuildingInspect } from '@pmu/shared/src/schema';
import type { Building } from '@pmu/shared/src/types';

export class BuildingSystem {
    private scene: Phaser.Scene;
    private network: NetworkManager;
    private buildingSprites: Map<string, Phaser.GameObjects.Container> = new Map();
    private buildingsGroup: Phaser.GameObjects.Group;

    constructor(scene: Phaser.Scene, network: NetworkManager) {
        this.scene = scene;
        this.network = network;
        this.buildingsGroup = this.scene.add.group();
    }

    public update(buildings: Building[]) {
        const activeIds = new Set<string>();

        buildings.forEach(b => {
            activeIds.add(b.id);
            this.updateBuilding(b);
        });

        // Cleanup
        for (const [id, sprite] of this.buildingSprites) {
            if (!activeIds.has(id)) {
                sprite.destroy();
                this.buildingSprites.delete(id);
            }
        }
    }

    private updateBuilding(data: Building) {
        let container = this.buildingSprites.get(data.id);
        const screenPos = IsoRenderer.worldToScreen({ x: data.position.x, y: data.position.y, z: 0 });

        if (container) {
            // Just update position
            container.setPosition(screenPos.x + 400, screenPos.y + 300);
            container.setDepth(screenPos.y);
            return;
        }

        // Use a container for the building visual + text
        container = this.scene.add.container(screenPos.x + 400, screenPos.y + 300); // Center offset
        container.setSize(128, 128);

        // Convert building name to sprite key: "Town Hall" -> "building_town_hall"
        const spriteKey = 'building_' + data.name.toLowerCase().replace(/\s+/g, '_');

        // Check if the texture exists
        let interactiveTarget: Phaser.GameObjects.GameObject | null = null;

        if (this.scene.textures.exists(spriteKey)) {
            // Use the sprite image
            const sprite = this.scene.add.image(0, 0, spriteKey);
            sprite.setOrigin(0.5, 0.6); // Lowered origin to move sprite down (was 0.85)
            sprite.setDisplaySize(128, 128); // Adjust size as needed
            container.add(sprite);

            // Make sprite interactive (pixel perfect if possible, or simple rect)
            sprite.setInteractive({ useHandCursor: true });
            interactiveTarget = sprite;
        } else {
            // Fallback: Use graphics (placeholder)
            const gfx = this.scene.add.graphics();
            gfx.fillStyle(0x885522);
            // Base
            gfx.fillPoints([
                { x: 0, y: -32 },
                { x: 32, y: -16 },
                { x: 0, y: 0 },
                { x: -32, y: -16 }
            ]);
            // Roof
            gfx.fillStyle(0xaa6633);
            gfx.fillPoints([
                { x: 0, y: -48 },
                { x: 32, y: -32 },
                { x: 0, y: -16 },
                { x: -32, y: -32 }
            ]);
            container.add(gfx);

            // Access underlying shape for hit area
            const hitArea = new Phaser.Geom.Polygon([
                0, -32,
                32, -16,
                0, 0,
                -32, -16
            ]);
            // For graphics, we can't easily set interactive on the graphics object with a shape unless we use a shape
            // So we'll set it on the container for fallback
            container.setInteractive(hitArea, Phaser.Geom.Polygon.Contains);
            interactiveTarget = container;
        }

        // Text
        const text = this.scene.add.text(0, -50, data.name, { fontSize: '12px', color: '#ffffff' });
        text.setOrigin(0.5);
        container.add(text);

        // Interaction
        if (interactiveTarget) {
            interactiveTarget.on('pointerdown', () => {
                console.log('Clicked building:', data.name);
                this.network.send({
                    type: ClientMessageType.BUILDING_INSPECT,
                    payload: { buildingId: data.id }
                } as MsgBuildingInspect);
            });

            interactiveTarget.on('pointerover', () => {
                text.setColor('#ffff00');
            });

            interactiveTarget.on('pointerout', () => {
                text.setColor('#ffffff');
            });
        }

        this.buildingSprites.set(data.id, container);
        this.buildingsGroup.add(container);

        container.setDepth(screenPos.y);
    }
}
