import Phaser from 'phaser';
import { NetworkManager } from './NetworkManager';
import { IsoRenderer } from './IsoRenderer';
import { BuildingSystem } from './BuildingSystem';
import { UIManager } from './UIManager';
import type { HeroState } from '@pmu/shared/src/types';
import { AssetLoader } from './map/AssetLoader';
import { ClientMapManager } from './map/ClientMapManager';

export class GameScene extends Phaser.Scene {
    private network!: NetworkManager;
    private buildingSystem!: BuildingSystem;
    private uiManager!: UIManager;
    private assetLoader!: AssetLoader;
    private mapManager!: ClientMapManager;

    private heroSprites: Map<string, Phaser.GameObjects.Arc> = new Map();
    private debugText!: Phaser.GameObjects.Text;

    constructor() {
        super('GameScene');
    }

    preload() {
        // Initialize Asset Loader
        this.assetLoader = new AssetLoader(this);

        // Preload tiles (Standard set 0-47, or user's sliced set 0-35)
        // User has sliced grass 0-35. Let's load 0-47 to be safe/generic or just 0-35.
        // The loader checks if file exists? No, Phaser queues it. 
        // We should stick to what we have or generic max.
        // Let's load 0-47 (standard blob) - if file missing, Phaser logs warning but continues.
        this.assetLoader.preloadTiles();

        this.load.image('dirt', 'assets/dirt.png'); // Keep legacy for fallback if needed
        // Building sprites
        this.load.image('building_town_hall', 'assets/building_town_hall.png');
        this.load.image('building_barracks', 'assets/building_barracks.png');
        this.load.image('building_the_anvil', 'assets/building_the_anvil.png');
        this.load.image('building_blacksmith', 'assets/building_the_anvil.png'); // Alias if needed
        this.load.image('building_golden_tankard', 'assets/building_golden_tankard.png');
    }

    private placementMode = false;
    private placementBuildingId: string | null = null;
    private ghostSprite: Phaser.GameObjects.Sprite | null = null;
    private ghostMarker: Phaser.GameObjects.Graphics | null = null;

    create() {
        this.network = new NetworkManager();
        this.network.connect('ws://localhost:3000');

        this.buildingSystem = new BuildingSystem(this, this.network);
        this.uiManager = new UIManager(this.network);
        this.mapManager = new ClientMapManager(this);

        // Render the Auto-Tiled Map
        this.mapManager.render();

        // Draw Grid Overlay (Optional, keep for debugging/placement visibility)
        this.drawGrid();

        // Initial Zoom for better view
        this.cameras.main.setZoom(0.8);
        this.cameras.main.centerOn(400, 300);

        // Zoom Controls
        this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, deltaX: number, deltaY: number, deltaZ: number) => {
            const newZoom = this.cameras.main.zoom - deltaY * 0.001;
            this.cameras.main.setZoom(Phaser.Math.Clamp(newZoom, 0.1, 2));
        });

        // Debug text update
        this.debugText = this.add.text(10, 10, 'Use Mouse Wheel to Zoom', { font: '16px Courier', color: '#00ff00' });
        this.debugText.setScrollFactor(0); // Fix to screen

        this.debugText = this.add.text(10, 10, 'Connecting...', {
            color: '#00ff00',
            backgroundColor: '#000000'
        });
        this.debugText.setScrollFactor(0);
        this.debugText.setDepth(2000); // High depth

        this.cameras.main.centerOn(400, 300);

        // Listen for placement mode event
        window.addEventListener('enter-placement-mode', (e: any) => {
            this.placementMode = true;
            this.placementBuildingId = e.detail.buildingId;
            console.log('Entered placement mode for:', this.placementBuildingId);
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.placementMode) {
                this.updatePlacementGhost(pointer);
            } else if (pointer.isDown) {
                this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x);
                this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y);
            }
        });

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.placementMode && this.placementBuildingId) {
                this.confirmPlacement(pointer);
            }
        });

        // Right click to cancel
        this.input.keyboard?.on('keydown-ESC', () => this.cancelPlacement());
    }

    private updatePlacementGhost(pointer: Phaser.Input.Pointer) {
        // Convert screen to world grid
        const centerX = 400; // Offset from createGround/drawGrid
        const centerY = 300;

        // Adjust pointer by camera scroll
        const worldPoint = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;

        // Remove center offset before converting
        const relativeX = worldPoint.x - centerX;
        const relativeY = worldPoint.y - centerY;

        const gridPos = IsoRenderer.screenToWorld(relativeX, relativeY);
        const gridX = Math.round(gridPos.x);
        const gridY = Math.round(gridPos.y);

        // Show marker
        if (!this.ghostMarker) {
            this.ghostMarker = this.add.graphics();
            this.ghostMarker.setDepth(1000);
        }
        this.ghostMarker.clear();
        this.ghostMarker.lineStyle(2, 0x00ff00);

        // Draw diamond around target tile
        const p1 = IsoRenderer.worldToScreen({ x: gridX, y: gridY, z: 0 });
        const p2 = IsoRenderer.worldToScreen({ x: gridX + 1, y: gridY, z: 0 });
        const p3 = IsoRenderer.worldToScreen({ x: gridX + 1, y: gridY + 1, z: 0 });
        const p4 = IsoRenderer.worldToScreen({ x: gridX, y: gridY + 1, z: 0 });

        this.ghostMarker.strokePoints([
            { x: p1.x + centerX, y: p1.y + centerY },
            { x: p2.x + centerX, y: p2.y + centerY },
            { x: p3.x + centerX, y: p3.y + centerY },
            { x: p4.x + centerX, y: p4.y + centerY },
            { x: p1.x + centerX, y: p1.y + centerY },
        ]);
    }

    private confirmPlacement(pointer: Phaser.Input.Pointer) {
        if (!this.placementBuildingId) return;

        const centerX = 400;
        const centerY = 300;
        const worldPoint = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
        const relativeX = worldPoint.x - centerX;
        const relativeY = worldPoint.y - centerY;

        const gridPos = IsoRenderer.screenToWorld(relativeX, relativeY);
        const gridX = Math.round(gridPos.x);
        const gridY = Math.round(gridPos.y);

        // Send move command
        this.network.send({
            type: 'BUILDING_MOVE',
            payload: {
                buildingId: this.placementBuildingId,
                position: { x: gridX, y: gridY }
            }
        } as any);

        this.cancelPlacement();
    }

    private cancelPlacement() {
        this.placementMode = false;
        this.placementBuildingId = null;
        if (this.ghostMarker) {
            this.ghostMarker.clear();
        }
    }

    update(time: number, delta: number) {
        if (!this.network.isConnected) {
            this.debugText.setText('Disconnected');
            return;
        }

        const snapshot = this.network.latestSnapshot;
        if (!snapshot) {
            this.debugText.setText('Waiting for server...');
            return;
        }

        this.debugText.setText(`Tick: ${snapshot.tick} | Heroes: ${snapshot.heroes.length}`);

        if (snapshot.buildings) {
            this.buildingSystem.update(snapshot.buildings);
        }

        const activeIds = new Set<string>();
        snapshot.heroes.forEach(hero => {
            activeIds.add(hero.id);
            this.updateHeroSprite(hero);
        });

        for (const [id, sprite] of this.heroSprites) {
            if (!activeIds.has(id)) {
                sprite.destroy();
                this.heroSprites.delete(id);
            }
        }
    }

    private updateHeroSprite(hero: HeroState) {
        let sprite = this.heroSprites.get(hero.id);

        if (!sprite) {
            const color = hero.faction === 'PLAYER' ? 0x00ff00 : 0xff0000;
            sprite = this.add.circle(0, 0, 10, color);
            this.heroSprites.set(hero.id, sprite);
        }

        const screenPos = IsoRenderer.worldToScreen(hero.position);
        sprite.setPosition(screenPos.x + 400, screenPos.y + 300);

        // Depth sort heroes based on Y
        sprite.setDepth(sprite.y);
    }

    private drawGrid() {
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x444444, 0.5);
        graphics.setDepth(500); // Between ground and objects

        const size = 10;
        const centerOffsetX = 400;
        const centerOffsetY = 300;

        for (let x = -size; x <= size; x++) {
            for (let y = -size; y <= size; y++) {
                const p1 = IsoRenderer.worldToScreen({ x: x, y: y, z: 0 });
                const p2 = IsoRenderer.worldToScreen({ x: x + 1, y: y, z: 0 });
                const p3 = IsoRenderer.worldToScreen({ x: x + 1, y: y + 1, z: 0 });
                const p4 = IsoRenderer.worldToScreen({ x: x, y: y + 1, z: 0 });

                graphics.strokePoints([
                    { x: p1.x + centerOffsetX, y: p1.y + centerOffsetY },
                    { x: p2.x + centerOffsetX, y: p2.y + centerOffsetY },
                    { x: p3.x + centerOffsetX, y: p3.y + centerOffsetY },
                    { x: p4.x + centerOffsetX, y: p4.y + centerOffsetY },
                    { x: p1.x + centerOffsetX, y: p1.y + centerOffsetY }
                ]);
            }
        }
    }
}
