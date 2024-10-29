// Script to convert levels from PNGs to CSVs, to help with converting into LDtk format.

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { PNG, PNGWithMetadata } from 'pngjs';
import { v4 as uuidv4 } from 'uuid';
import { EntityInstance } from '../src/ts/lib/ldtk-json';

const tileSize = 16;

const program = new Command();
program.option('--output <type>', 'output format', 'tiles').parse(process.argv);

const options = program.opts();
const outputFormat = options.output === 'entities' ? 'entities' : 'tiles';

const filePath = 'src/static/level/level.png';

// Read the PNG file
const buffer = readFileSync(filePath);

// Parse the PNG file
const png = PNG.sync.read(buffer);

const [intGrid, entities] = convertLevel(png);

if (outputFormat === 'entities') {
    console.log(JSON.stringify(entities));
    process.exit(0);
} else if (outputFormat === 'tiles') {
    // Output the CSV as a 1D array.
    const csv = intGrid.map((row) => row.join(',')).join(',\n');
    console.log(csv);
}

// Loop through each pixel, convert to int grid values.
function convertLevel(png: PNGWithMetadata): [number[][], EntityInstance[]] {
    const intGrid: number[][] = [];
    for (let y = 0; y < png.height; y++) {
        const row: number[] = new Array(png.width).fill(0);
        intGrid.push(row);
    }

    const entities: EntityInstance[] = [];
    for (let y = 0; y < png.height; y++) {
        for (let x = 0; x < png.width; x++) {
            const baseEntityInfo = {
                iid: uuidv4(),
                __grid: [x, y],
                __pivot: [0.5, 1],
                px: [(x + 0.5) * tileSize, (y + 1) * tileSize],
                width: 16,
                height: 16,
                __tags: [],
                fieldInstances: [],
                __smartColor: '#FF00FF',
            };
            const color = pixelToColorString(png, x, y);
            if (color === 'ffffff') {
                // Don't need to do anything for empty tiles as they're the default.
            } else if (color === '000000') {
                // Ground.
                intGrid[y][x] = 1;
            } else if (color === 'ff00ff') {
                // Player spawn.
                entities.push(
                    Object.assign(baseEntityInfo, {
                        __identifier: 'Spawn',
                        defUid: 1375,
                    })
                );
            } else if (color === 'ff01ff') {
                // Lil guy spawn.
                entities.push(
                    Object.assign(baseEntityInfo, {
                        __identifier: 'Lilguy',
                        defUid: 1409,
                    })
                );
            } else if (color === 'ffff00') {
                // Torches.
                entities.push(
                    Object.assign(baseEntityInfo, {
                        __identifier: 'Torch',
                        defUid: 1412,
                    })
                );
            } else if (color === 'ffff99') {
                // Torches.
                entities.push(
                    Object.assign(baseEntityInfo, {
                        __identifier: 'InvisibleRespawn',
                        defUid: 1414,
                    })
                );
            } else if (
                color.slice(0, 5) === 'ff000' ||
                color.slice(0, 5) === 'ff001'
            ) {
                // Creature
                entities.push(
                    Object.assign(baseEntityInfo, {
                        __identifier: 'CreatureEnemy',
                        defUid: 1411,
                    })
                );
            } else if (color === '333333') {
                // Platform
                intGrid[y][x] = 2;
            } else if (color === '0000ff') {
                // Destroyable
                intGrid[y][x] = 3;
            } else if (color === '0066ff') {
                // Column.
                // Two invisible tiles.
                intGrid[y][x] = 4;
                intGrid[y-1][x] = 4;
                entities.push(
                    Object.assign(baseEntityInfo, {
                        __identifier: 'Column',
                        defUid: 1413,
                        height: 32,
                    })
                );
            } else if (color === '0fffff') {
                // Waterfall.
                entities.push(
                    Object.assign(baseEntityInfo, {
                        __identifier: 'WaterfallStart',
                        defUid: 1415,
                        __pivot: [0.5, 0.5],
                        px: [(x + 0.5) * tileSize, (y + 0.5) * tileSize],
                    })
                );
            } else {
                console.log(`Unknown color: ${color} at ${x}, ${y}.`);
            }
        }
    }
    return [intGrid, entities];
}

function pixelToColorString(
    png: PNGWithMetadata,
    x: number,
    y: number
): string {
    const idx = (png.width * y + x) << 2;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    return (
        r.toString(16).padStart(2, '0') +
        g.toString(16).padStart(2, '0') +
        b.toString(16).padStart(2, '0')
    );
}
