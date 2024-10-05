import { FacingDir } from '../../common';
import { FPS, physFromPx, PHYSICS_SCALE, rng, TILE_SIZE } from '../../constants';
import { Aseprite } from '../../lib/aseprite';
import { lerp } from '../../lib/util';
import { Entity } from './entity';
import { Player } from './player';

const speedNoise = 0.1 * PHYSICS_SCALE * FPS;

// A lil guy that follows the player
export class Guy extends Entity {
    runSpeed = 1.5 * PHYSICS_SCALE * FPS;
    jumpSpeed = 3 * PHYSICS_SCALE * FPS;
    smallJumpSpeed = 1 * PHYSICS_SCALE * FPS;
    groundAccel = (0.25 * PHYSICS_SCALE * FPS * FPS) / 2;
    airAccel = (0.125 * PHYSICS_SCALE * FPS * FPS) / 2;
    gravity = 0.13 * PHYSICS_SCALE * FPS * FPS;

    w = physFromPx(3);
    h = physFromPx(3);

    reflexTime = lerp(0.1, 0.5, rng());
    reflexCount = 0;

    jumpCount = 0;
    tryingToJump = false;

    isTooFarCount = 0;
    maxIsTooFarCount = 1;

    closeness = lerp(physFromPx(5), physFromPx(15), rng());

    player: Player | undefined;

    update(dt: number): void {
        if (this.player === undefined) {
            this.player = this.level.getEntity(Player)!;
        }

        this.animCount += dt;

        if (this.jumpCount >= 0) {
            this.jumpCount -= dt;
        }

        // TODO: This could be replaced with proper pathfinding. For the moment, just move towards the player.
        if (this.midX < this.player.midX - this.closeness) {
            this.reflexCount += dt;
            if (this.reflexCount > this.reflexTime) {
                this.moveRight(dt);
            }
        }
        else if (this.midX > this.player.midX + this.closeness) {
            this.reflexCount += dt;
            if (this.reflexCount > this.reflexTime) {
                this.moveLeft(dt);
            }
        }
        else {
            this.reflexCount = 0;
            this.dampX(dt);
        }

        if (this.isTooFar()) {
            this.isTooFarCount += dt;
            if (this.isTooFarCount > this.maxIsTooFarCount) {
                this.teleportToPlayer();
            }
        }
        else {
            this.isTooFarCount = 0;
        }

        const playerIsAbove = this.player.maxY < this.maxY - TILE_SIZE;

        if (playerIsAbove) {
            if (!this.tryingToJump) {
                this.tryingToJump = true;
                this.jumpCount = this.reflexTime;
            }
        }
        else {
            this.tryingToJump = false;
        }

        if (this.isStanding()) {
            if (this.tryingToJump && this.jumpCount <= 0 && playerIsAbove) {
                this.jump();
                this.tryingToJump = false;
                this.jumpCount = 0;
            }
            else if (rng() < 0.03) {
                this.smallJump();
            }
        }

        this.limitFallSpeed(dt);
        this.applyGravity(dt);

        this.move(dt);
    }

    teleportToPlayer() {
        this.midX = this.player!.midX;
        this.maxY = this.player!.maxY;
        this.dx = this.player!.dx + lerp(-speedNoise, speedNoise, rng());
        this.dy = this.player!.dy + lerp(-speedNoise, speedNoise, rng());
    }

    isTooFar() {
        // Less lenient in the y direction
        const yDiff = Math.abs(this.maxY - this.player!.maxY);
        const xDiff = Math.abs(this.midX - this.player!.midX);
        return yDiff > 1.5 * TILE_SIZE || xDiff > 8 * TILE_SIZE;
    }

    smallJump() {
        this.dy = -this.smallJumpSpeed;
    }

    jump() {
        this.dy = -this.jumpSpeed;
    }

    moveLeft(dt: number) {
        const accel = this.isStanding() ? this.groundAccel : this.airAccel;
        this.dx -= accel * dt;
        if (this.dx < -this.runSpeed) {
            this.dx = -this.runSpeed;
        }
        this.facingDir = FacingDir.Left;
    }

    moveRight(dt: number) {
        const accel = this.isStanding() ? this.groundAccel : this.airAccel;
        this.dx += accel * dt;
        if (this.dx > this.runSpeed) {
            this.dx = this.runSpeed;
        }
        this.facingDir = FacingDir.Right;
    }

    onLeftCollision(): void {
        const initialDx = this.dx;
        super.onLeftCollision();
        this.dx = -initialDx;
    }

    onRightCollision(): void {
        const initialDx = this.dx;
        super.onRightCollision();
        this.dx = -initialDx;
    }


    render(context: CanvasRenderingContext2D): void {
        // super.render(context);

        const animationName = Math.abs(this.dx) > 0.1 ? 'run' : 'idle';

        Aseprite.drawAnimation({
            context,
            image: 'lilguy',
            animationName,
            time: this.animCount,
            position: { x: this.midX, y: this.maxY },
            scale: PHYSICS_SCALE,
            anchorRatios: { x: 0.5, y: 1 },
            flippedX: this.facingDir === FacingDir.Right,
            loop: true,
        });
    }

    static async preload() {
        await Aseprite.loadImage({ name: 'lilguy', basePath: "sprites" });
    }
}
