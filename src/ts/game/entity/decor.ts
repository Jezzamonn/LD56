import { physFromPx, PHYSICS_SCALE } from '../../constants';
import { Aseprite } from '../../lib/aseprite';
import { lerp, seededRandom } from '../../lib/util';
import { Level } from '../level';
import { BaseTile } from '../tile/base-layer';
import { Entity } from './entity';

export class Decor extends Entity {
    x = physFromPx(16);
    y = physFromPx(16);

    frame = 0;

    render(context: CanvasRenderingContext2D) {
        Aseprite.drawSprite({
            context,
            image: 'grass',
            frame: this.frame,
            position: { x: this.x, y: this.y },
            scale: PHYSICS_SCALE,
            anchorRatios: { x: 0, y: 0 },
        });
    }

    static addDecorToLevel(level: Level) {
        // Use a new RNG so it's consistent.
        const rng = seededRandom('gjskljkdljf');

        for (
            let x = level.tiles.baseLayer.minX;
            x <= level.tiles.baseLayer.maxX;
            x++
        ) {
            for (
                let y = level.tiles.baseLayer.minY;
                y <= level.tiles.baseLayer.maxY;
                y++
            ) {
                const tile = level.tiles.baseLayer.getTile({ x, y });
                const down = level.tiles.baseLayer.getTile({ x, y: y + 1 });
                const up = level.tiles.baseLayer.getTile({ x, y: y - 1 });
                const left = level.tiles.baseLayer.getTile({ x: x - 1, y });
                const right = level.tiles.baseLayer.getTile({ x: x + 1, y });

                function maybeAddDecorWithFrameRange(start: number, end: number) {
                    if (rng() > 0.2) {
                        return;
                    }

                    const decor = new Decor(level);
                    const tilePos = level.tiles.getTileCoord({ x, y }, { x: 0, y: 0 });
                    decor.x = tilePos.x;
                    decor.y = tilePos.y;
                    decor.frame = Math.floor(lerp(start, end, rng()));
                    level.immediatelyAddEntity(decor);
                }

                if (tile === BaseTile.Empty && down === BaseTile.Wall) {
                    maybeAddDecorWithFrameRange(0, 2);
                }

                if (tile === BaseTile.Empty && up === BaseTile.Wall) {
                    maybeAddDecorWithFrameRange(2, 4);
                }

                if (tile === BaseTile.Empty && left === BaseTile.Wall) {
                    maybeAddDecorWithFrameRange(4, 6);
                }

                if (tile === BaseTile.Empty && right === BaseTile.Wall) {
                    maybeAddDecorWithFrameRange(6, 8);
                }
            }
        }
    }
}
