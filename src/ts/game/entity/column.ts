import { physFromPx, PHYSICS_SCALE } from "../../constants";
import { Aseprite } from "../../lib/aseprite";
import { BaseTile } from "../tile/base-layer";
import { Entity } from "./entity";
import { Guy } from "./guy";

export class Column extends Entity {
    w = physFromPx(16);
    h = physFromPx(32);

    guysNeeded = 10;

    guys = new Set<Guy>();

    get health() {
        return this.guysNeeded - this.guys.size;
    }

    update(dt: number): void {
        super.update(dt);
    }

    reset() {
        this.guys.clear();
    }

    registerHit(guy: Guy) {
        this.guys.add(guy);

        if (this.health <= 0) {
            this.done = true;
            // Also remove the invisible wall
            this.level.tiles.baseLayer.floodFillTileAtCoord({x: this.midX, y: this.midY}, BaseTile.InvisibleWall, BaseTile.Empty);
        }
    }

    render(context: CanvasRenderingContext2D): void {
        Aseprite.drawSprite({
            context,
            image: 'column',
            frame: 0,
            position: { x: this.midX, y: this.maxY },
            scale: PHYSICS_SCALE,
            anchorRatios: { x: 0.5, y: 1 },
        });

        const fontSize = 8 * PHYSICS_SCALE;
        context.font = `${fontSize}px 'ChevyRay - Babyblocks'`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "#30343e";
        context.fillText(this.health.toString(), this.midX, this.midY);
    }

}