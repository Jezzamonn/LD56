// Script to convert levels from PNGs to CSVs, to help with converting into LDtk format.

import { readFileSync } from 'fs';
import { PNG, PNGWithMetadata } from 'pngjs';

const filePath = 'src/static/level/level.png';

// Read the PNG file
const buffer = readFileSync(filePath);

// Parse the PNG file
const png = PNG.sync.read(buffer);

const intGrid: number[][] = convertToGrid(png);

// Output the CSV as a 1D array.
const csv = intGrid.map((row) => row.join(',')).join(',\n');
console.log(csv);

// Loop through each pixel, convert to int grid values.
function convertToGrid(png: PNGWithMetadata): number[][] {
    const intGrid: number[][] = [];
    for (let y = 0; y < png.height; y++) {
        const row: number[] = [];
        intGrid.push(row);
        for (let x = 0; x < png.width; x++) {
            const color = pixelToColorString(png, x, y);
            let tile = 0;
            if (color === 'ffffff') {
                // Don't need to do anything for empty tiles as they're the default.
            } else if (color === '000000') {
                // Ground.
                tile = 1;
            } else if (color === 'ff00ff') {
                // Player spawn.
            } else if (color === 'ff01ff') {
                // Lil guy spawn.
            } else if (color === 'ffff00' || color === 'ffff99') {
                // Torches.
            } else if (
                color.slice(0, 5) === 'ff000' ||
                color.slice(0, 5) === 'ff001'
            ) {
                // Creature
            } else if (color === '333333') {
                // Platform
                tile = 2;
            } else if (color === '0000ff') {
                // Destroyable
                tile = 3;
            } else if (color === '0066ff') {
                // Invisible wall.
                tile = 4;
            } else if (color === '0fffff') {
                // Waterfall.
            } else {
                console.log(`Unknown color: ${color} at ${x}, ${y}.`);
            }
            row.push(tile);
        }
    }
    return intGrid;
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
