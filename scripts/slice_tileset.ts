import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { parseArgs } from 'util';

// Parse arguments
const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
        input: { type: 'string', short: 'i' },
        output: { type: 'string', short: 'o' },
        width: { type: 'string', short: 'w', default: '32' },
        height: { type: 'string', short: 'h', default: '32' },
        margin: { type: 'string', short: 'm', default: '0' },
        spacing: { type: 'string', short: 's', default: '0' },
    },
});

async function main() {
    if (!values.input || !values.output) {
        console.error('Usage: npx tsx scripts/slice_tileset.ts -i <input_file> -o <terrain_name> [-w 32] [-h 32]');
        process.exit(1);
    }

    const inputFile = path.resolve(values.input);
    const terrainName = values.output;
    const tileWidth = parseInt(values.width || '32');
    const tileHeight = parseInt(values.height || '32');
    const margin = parseInt(values.margin || '0');
    const spacing = parseInt(values.spacing || '0');

    if (!fs.existsSync(inputFile)) {
        console.error(`Input file not found: ${inputFile}`);
        process.exit(1);
    }

    // Output directory: client/assets/tiles/{terrainName}
    const outputDir = path.resolve(process.cwd(), 'client/assets/tiles', terrainName);

    if (!fs.existsSync(outputDir)) {
        console.log(`Creating directory: ${outputDir}`);
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Processing ${inputFile}...`);
    console.log(`Output to: ${outputDir}`);
    console.log(`Tile Size: ${tileWidth}x${tileHeight}`);

    const image = sharp(inputFile);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
        console.error('Could not get image metadata');
        process.exit(1);
    }

    const cols = Math.floor((metadata.width - margin) / (tileWidth + spacing));
    const rows = Math.floor((metadata.height - margin) / (tileHeight + spacing));

    console.log(`Grid: ${cols} cols x ${rows} rows`);

    let count = 0;

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const left = Math.floor(margin + x * (tileWidth + spacing));
            const top = Math.floor(margin + y * (tileHeight + spacing));

            // Validate bounds strictly
            if (left + tileWidth > (metadata.width || 0) || top + tileHeight > (metadata.height || 0)) {
                console.warn(`Skipping tile ${x},${y} (Out of bounds): ${left},${top}`);
                continue;
            }

            // Extract tile
            const region = {
                left: left,
                top: top,
                width: tileWidth,
                height: tileHeight
            };

            const paddedIndex = count.toString().padStart(3, '0');
            const filename = `${terrainName}_${paddedIndex}.png`;
            const outputPath = path.join(outputDir, filename);

            try {
                // Use clone() to ensure we don't affect the main pipeline state if that's an issue
                await image
                    .clone()
                    .extract(region)
                    .toFile(outputPath);

                // Log explicitly with newline to ensure flush
                console.log(`Saved tile ${count}: ${filename} [${left},${top}]`);
            } catch (err: any) {
                console.error(`Failed to save tile ${count} at ${left},${top}:`, err.message);
            }

            count++;
        }
    }

    console.log(`\nDone! Sliced ${count} tiles.`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
