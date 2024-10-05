import { Point } from "../../common";
import { FPS, physFromPx, PHYSICS_SCALE } from "../../constants";
import { Aseprite } from "../../lib/aseprite";
import { Level } from "../level";
import { Entity } from "./entity";

const SPEED = 6 * PHYSICS_SCALE * FPS;

export class Bullet extends Entity {

    // Bullets last 3 seconds.
    lifetime = 3;

    constructor(level: Level) {
        super(level);

        // No gravity I guess :)
        this.gravity = 0;
        // No damping either
        this.xDampAmt = 0;

        this.w = physFromPx(4);
        this.h = physFromPx(4);

        this.debugColor = "white";
    }

    setDirection(dir: Point) {
        this.dx = dir.x * SPEED;
        this.dy = dir.y * SPEED;

        // Stretch w or h
        if (dir.x !== 0) {
            this.w = physFromPx(16);
        }
        if (dir.y !== 0) {
            this.h = physFromPx(16);
        }
    }

    onDownCollision(): void {
        this.done = true;
    }

    onLeftCollision(): void {
        this.done = true;
    }

    onRightCollision(): void {
        this.done = true;
    }

    onUpCollision(): void {
        this.done = true;
    }

    update(dt: number) {
        super.update(dt);

        if (this.animCount > this.lifetime) {
            this.done = true;
        }
    }

    render(context: CanvasRenderingContext2D): void {
        // super.render(context);

        const animationName = this.w > this.h ? 'fire-hori' : 'fire-vert';

        Aseprite.drawAnimation({
            context,
            image: "lilguy",
            animationName,
            time: this.animCount,
            position: { x: this.midX, y: this.maxY },
            scale: PHYSICS_SCALE,
            anchorRatios: { x: 0.5, y: 1 },
            flippedX: this.dx > 0,
            loop: true,
        });
    }
}