// Script to convert the smaller quarter-tiles format to regular tiles.

import { createCanvas, loadImage } from 'canvas';

import { writeFile } from 'fs/promises';
import { Point } from '../src/ts/common';

const quarterTilesPath = 'sprites/quarter-tiles.png';
const outPath = 'sprites/expanded-tiles.png';

const tileSize = 16;
const qTileSize = 8;

const outTileWidth = 12;
const outTileHeight = 5;

// ASCII diagram for LDTK's tile layout.
// Easiest way to visually represent this. The script will then parse it.
const tileLayout = `
+---+---+---+---+---+---+---+---+---+---+---+---+
|   |   |   |   |   |   |   |   | ##|## | # | # |
| ##|###|## | ##|###|## |###|###|###|###|###|###|
| ##|###|## |   |   |   | ##|## | ##|## | ##|## |
+---+---+---+---+---+---+---+---+---+---+---+---+
| ##|###|## |   |   |   | ##|## |###| # | ##|## |
| ##|###|## | # | # |   |###|###|###|###|###|###|
| ##|###|## |   | # |   |   |   | # |###| # | # |
+---+---+---+---+---+   +---+---+---+---+---+---+
| ##|###|## | # | # |   | # | # | # |   | ##|
| ##|###|## |###| # |   | ##|## | ##|###|###|
|   |   |   | # | # |   | ##|## | # | # |## |
+---+---+---+---+---+   +---+---+---+---+---+
| ##|## |   |   | # |   | ##|## | # | # |## |
|###|###| ##|## | # |   | ##|## |###|## |###|
|###|###| # | # |   |   | # | # |   | # | ##|
+---+---+---+---+---+   +---+---+---+---+---+
|###|###| # | # |
|###|###| ##|## |
| ##|## |   |   |
+---+---+---+---+
`;

const tileLayoutLines = tileLayout.trim().split('\n');
console.log(tileLayoutLines);

async function main() {
    // Read/parse the PNG file.
    const quarterTiles = await loadImage(quarterTilesPath);

    // Create a new PNG to write to.
    const out = createCanvas(outTileWidth * tileSize, outTileHeight * tileSize);
    const outContext = out.getContext('2d');

    for (let y = 0; y < outTileHeight; y++) {
        for (let x = 0; x < outTileWidth; x++) {
            const centerPos = {
                x: x * 4 + 2,
                y: y * 4 + 2,
            }
            const center = tileLayoutLines[centerPos.y][centerPos.x];
            if (center === ' ' || center === undefined) {
                continue;
            }

            outContext.fillRect(
                x * tileSize,
                y * tileSize,
                tileSize,
                tileSize
            );

            for (const dy of [-1, 1]) {
                for (const dx of [-1, 1]) {
                    const dxTile = tileLayoutLines[centerPos.y][centerPos.x + dx];
                    const dyTile = tileLayoutLines[centerPos.y + dy][centerPos.x];
                    const dxdyTile = tileLayoutLines[centerPos.y + dy][centerPos.x + dx];
                    let tilePos: Point = { x: 0, y: 0 };
                    const subTilePos = { x: dx < 0 ? 0 : 1, y: dy < 0 ? 0 : 1 };

                    if (dxTile !== '#') {
                        tilePos.x += 1;
                    }
                    if (dyTile !== '#') {
                        tilePos.y += 1;
                    }
                    // Special case for the corner piece.
                    if (dxTile === '#' && dyTile === '#' && dxdyTile !== '#') {
                        tilePos.y += 2;
                    }

                    outContext.drawImage(
                        quarterTiles,
                        tilePos.x * tileSize + subTilePos.x * qTileSize,
                        tilePos.y * tileSize + subTilePos.y * qTileSize,
                        qTileSize,
                        qTileSize,
                        x * tileSize + subTilePos.x * qTileSize,
                        y * tileSize + subTilePos.y * qTileSize,
                        qTileSize,
                        qTileSize
                    );
                }
            }
        }
    }

    // Write the new PNG.
    const buffer = out.toBuffer('image/png');
    await writeFile(outPath, buffer);

    console.log('The PNG file was created.');
}

main();