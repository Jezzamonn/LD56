import { physFromPx, PHYSICS_SCALE, TILE_SIZE } from '../../constants';
import { Aseprite } from '../../lib/aseprite';
import { BaseTile } from '../tile/base-layer';
import { Entity } from './entity';

const waterfallSet = new Set(['waterfall']);
const lavafallSet = new Set(['lavafall']);

export class Waterfall extends Entity {
    w = physFromPx(16);
    h = physFromPx(16);
    length: number | undefined;

    render(context: CanvasRenderingContext2D): void {
        if (this.length === undefined) {
            // Calculate the length by looking for the next ground tile.
            this.length = 1;
            while (true) {
                const tile = this.level.tiles.baseLayer.getTileAtCoord({
                    x: this.midX,
                    y: this.maxY + this.length * this.h,
                });
                if (tile === BaseTile.Wall) {
                    break;
                }
                this.length++;
            }
            console.log('waterfall length = ', this.length);
        }

        const layers = this.y / TILE_SIZE > 90 ? lavafallSet : waterfallSet;

        for (var i = 0; i < this.length; i++) {
            Aseprite.drawAnimation({
                context,
                image: 'waterfall',
                animationName: i === 0 ? 'top' : 'repeat',
                time: this.animCount,
                position: { x: this.midX, y: this.maxY + i * this.h },
                scale: PHYSICS_SCALE,
                anchorRatios: { x: 0.5, y: 1 },
                layers,
            });
        }
    }
}
