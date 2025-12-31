
import fs from 'fs';
import path from 'path';

const ASSETS_DIR = path.join(__dirname, '../client/assets/tiles');
const OUTPUT_FILE = path.join(__dirname, '../client/src/map/tile_manifest.json');

// Define known categories to scan
const CATEGORIES = ['full', 'edge', 'corner', 'inner', 't', 'straight'];

interface TileManifest {
    [terrain: string]: {
        [category: string]: number; // count of variants
    };
}

const manifest: TileManifest = {};

function scanDirectory() {
    if (!fs.existsSync(ASSETS_DIR)) {
        console.error(`Assets directory not found: ${ASSETS_DIR}`);
        process.exit(1);
    }

    const terrains = fs.readdirSync(ASSETS_DIR).filter(f => fs.statSync(path.join(ASSETS_DIR, f)).isDirectory());

    terrains.forEach(terrain => {
        manifest[terrain] = {};
        const terrainPath = path.join(ASSETS_DIR, terrain);

        CATEGORIES.forEach(category => {
            const categoryPath = path.join(terrainPath, category);
            if (fs.existsSync(categoryPath)) {
                const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.png'));
                // Count unique variants by parsing filename? 
                // Convention: {terrain}_{kind}_{variant}.png
                // Actually, just counting them is enough if they are all valid variants.
                // Or we can map "kind" -> count.

                // Wait, "category" is just the folder. Inside we have specific kinds.
                // e.g. edge folder has edge_n, edge_s, etc.
                // We need to group by Kind.

                files.forEach(file => {
                    // Parse filename: grass_edge_n_0.png
                    // Parts: [grass, edge, n, 0]
                    // This is tricky if split by _.
                    // Better regex: ({terrain})_({kind})_{variant}.png
                    // But kind can have underscores (edge_n).

                    // Helper: remove extension, remove terrain prefix, remove suffix variant.
                    const nameNoExt = path.basename(file, '.png'); // grass_edge_n_0

                    // Remove terrain prefix
                    if (!nameNoExt.startsWith(terrain + '_')) return;
                    const remainder = nameNoExt.substring(terrain.length + 1); // edge_n_0

                    // Extract variant (last number)
                    const lastUnderscore = remainder.lastIndexOf('_');
                    if (lastUnderscore === -1) return;

                    const kind = remainder.substring(0, lastUnderscore); // edge_n
                    // VARIANT IS NOT NEEDED IN MANIFEST count if we just want to know "how many for this kind"

                    if (!manifest[terrain][kind]) {
                        manifest[terrain][kind] = 0;
                    }
                    // Use Set to track unique variants? 
                    // Or just increment? 
                    // If user has _0, _1, _2 -> Count is 3. 
                    // Let's assume files are correct. 
                    // We actually need the Max Variant Index or the Count.
                    // Let's store the Count.

                    // Ideally we track the set of variants.
                });
            }
        });

        // Re-scan to properly count
        // Because forEach above iterates files, we need to aggregate.
        const kindCounts: Record<string, Set<string>> = {};

        CATEGORIES.forEach(category => {
            const categoryPath = path.join(terrainPath, category);
            if (fs.existsSync(categoryPath)) {
                const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.png'));
                files.forEach(file => {
                    const nameNoExt = path.basename(file, '.png');
                    if (!nameNoExt.startsWith(terrain + '_')) return;
                    const remainder = nameNoExt.substring(terrain.length + 1);
                    const lastUnderscore = remainder.lastIndexOf('_');
                    if (lastUnderscore === -1) return;

                    const kind = remainder.substring(0, lastUnderscore);
                    const variant = remainder.substring(lastUnderscore + 1);

                    if (!kindCounts[kind]) kindCounts[kind] = new Set();
                    kindCounts[kind].add(variant);
                });
            }
        });

        // Convert Sets to counts
        for (const [kind, variants] of Object.entries(kindCounts)) {
            manifest[terrain][kind] = variants.size;
        }
    });

    // Write manifest
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
    console.log(`Manifest generated at ${OUTPUT_FILE}`);
}

scanDirectory();
