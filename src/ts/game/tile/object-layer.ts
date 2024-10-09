import { Point } from "../../common";
import { TILE_SIZE } from "../../constants";
import { TileLayer } from "./tile-layer";

export enum ObjectTile {
    Empty = 0,
    Spawn = 1,
    Goal = 2,
    Platform = 3,
    Destroyable = 4,
}

// Position of the tile in the tileset.
const tilePositions = {
    [ObjectTile.Platform]: { x: 2, y: 0 },
    [ObjectTile.Destroyable]: { x: 7, y: 5 },
}

export class ObjectLayer extends TileLayer<ObjectTile> {

    renderTile(context: CanvasRenderingContext2D, pos: Point): void {
        const tile = this.getTile(pos);
        const renderPos = {x: pos.x * TILE_SIZE, y: pos.y * TILE_SIZE }

        let tilePos = tilePositions[tile];
        if (!tilePos) {
            return;
        }

        if (tile == ObjectTile.Platform && pos.y >= 90) {
            tilePos = {...tilePos};
            tilePos.x += 4;
        }

        this.drawTile(context, {tilePos, renderPos});
    }
}
