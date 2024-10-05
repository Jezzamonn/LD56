import { Dir } from "../../common";
import { FPS, physFromPx, PHYSICS_SCALE } from "../../constants";
import { Aseprite } from "../../lib/aseprite";
import { Creature } from "./enemies/creature";
import { Entity } from "./entity";
import { Guy } from "./guy";
import { Player } from "./player";

const SPEED = 6 * PHYSICS_SCALE * FPS;

export class Bullet extends Entity {

    // Bullets last 3 seconds.
    lifetime = 3;
    guy: Guy;

    gravity = 0;
    xDampAmt = 0;
    w = physFromPx(4);
    h = physFromPx(4);
    dir: Dir;

    setDirection(dir: Dir) {
        this.dir = dir;
        const point = Dir.toPoint(dir);
        this.dx = point.x * SPEED;
        this.dy = point.y * SPEED;

        // Stretch w or h
        if (point.x !== 0) {
            this.w = physFromPx(16);
        }
        if (point.y !== 0) {
            this.h = physFromPx(16);
        }
    }

    onDownCollision(): void {
        super.onDownCollision();
        this.endBullet();
        this.guy.maxY = this.maxY;
    }

    onLeftCollision(): void {
        super.onLeftCollision();
        this.endBullet();
        this.guy.minX = this.minX;
    }

    onRightCollision(): void {
        super.onRightCollision();
        this.endBullet();
        this.guy.maxX = this.maxX;
    }

    onUpCollision(): void {
        super.onUpCollision();
        this.endBullet();
        this.guy.minY = this.minY;
    }

    endBullet() {
        this.level.addEntity(this.guy);
        this.guy.done = false;
        this.guy.midX = this.midX;
        this.guy.midY = this.midY;
        this.guy.dx = 0;
        this.guy.dy = 0;
        this.done = true;
        // Add back to player I guess
        const player = this.level.getEntity(Player)!
        player.guys.push(this.guy);
    }

    update(dt: number) {
        super.update(dt);

        // Check if we've hit an enemy
        for (const entity of this.level.entities) {
            if (entity instanceof Creature) {
                if (this.isTouchingEntity(entity)) {
                    entity.hurt(this.dir)
                    this.endBullet();
                    return;
                }
            }
        }

        if (this.animCount > this.lifetime) {
            this.endBullet();
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