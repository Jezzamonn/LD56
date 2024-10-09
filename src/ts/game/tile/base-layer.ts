import { Point } from "../../common";
import { TILE_SIZE } from "../../constants";
import { TileLayer } from "./tile-layer";

export enum BaseTile {
    Empty = 0,
    Wall = 1,
    Unknown = 3, // Used temporarily when creating the level. Will be filled in later.
    InvisibleWall = 4,
}

export class BaseLayer extends TileLayer<BaseTile> {

    constructor(w: number, h: number) {
        super(w, h);
    }

    fillInUnknownTiles() {
        for (let y = this.minY; y <= this.maxY; y++) {
            for (let x = this.minX; x <= this.maxX; x++) {
                if (this.getTile({x, y}) == BaseTile.Unknown) {
                    // console.log('filling in unknown tile', x, y)
                    // Unknown tiles are filled based on the tile to the left and right.
                    const horizontalTiles = [
                        this.getTile({ x: x - 1, y }),
                        this.getTile({ x: x + 1, y }),
                    ];

                    let newTile = this.pickTileToFillUnknown(horizontalTiles);

                    this.setTile({x, y}, newTile);
                }
            }
        }
    }

    pickTileToFillUnknown(neighbors: BaseTile[]): BaseTile {
        return BaseTile.Empty;
        // // Filter out walls.
        // const filteredNeighbors = neighbors.filter((tile) => tile != BaseTile.Wall);
        // // Sort them (sort of a hack but works ok).
        // const sortedNeighbors = filteredNeighbors.sort();
        // // Because there's just two, we don't need to do the whole sorting thing... just pick the first.
        // // If this is empty, there are two walls. We use the background tile for that case.
        // return sortedNeighbors.length > 0 ? sortedNeighbors[0] : BaseTile.Background;
    }

    renderTile(
        context: CanvasRenderingContext2D,
        pos: Point,
    ) {
        const tile = this.getTile(pos);
        const renderPos = {x: pos.x * TILE_SIZE, y: pos.y * TILE_SIZE }

        if (tile == BaseTile.Wall) {
            // Loop through each corner
            for (const dx of [-1, 1]) {
                const dxTile = this.getTile({ x: pos.x + dx, y: pos.y });
                for (const dy of [-1, 1]) {
                    const subTilePos = { x: dx < 0 ? 0 : 1, y: dy < 0 ? 0 : 1}
                    const dyTile = this.getTile({ x: pos.x, y: pos.y + dy });
                    const dxdyTile = this.getTile({ x: pos.x + dx, y: pos.y + dy });
                    let tilePos: Point = { x: 0, y: 0 };

                    if (dxTile !== BaseTile.Wall) {
                        tilePos.x += 1;
                    }
                    if (dyTile !== BaseTile.Wall) {
                        tilePos.y += 1;
                    }
                    // // Special case for the corner piece.
                    if (dxTile === BaseTile.Wall && dyTile === BaseTile.Wall && dxdyTile !== BaseTile.Wall) {
                        tilePos.y += 2;
                    }

                    if (pos.y >= 90) {
                        tilePos.x += 4;
                    }

                    this.drawQuarterTile(
                        context,
                        {
                            tilePos,
                            subTilePos,
                            renderPos
                        }
                    );
                }
            }
        }
    }

}