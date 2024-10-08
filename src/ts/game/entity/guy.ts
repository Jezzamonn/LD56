import { FacingDir } from '../../common';
import {
    FPS,
    physFromPx,
    PHYSICS_SCALE,
    rng,
    TILE_SIZE,
} from '../../constants';
import { Aseprite } from '../../lib/aseprite';
import { lerp } from '../../lib/util';
import { SFX } from '../sfx/sfx';
import { Notifications } from '../ui/notification';
import { RunningEntity } from './running-entity';

const speedNoise = 0.1 * PHYSICS_SCALE * FPS;

export enum GuyType {
    Normal = 'normal',
    Fire = 'fire',
}

export namespace GuyType {
    const types = ['normal', 'fire'];

    export const sets = {};

    for (const type of types) {
        sets[type] = new Set([type]);
    }
}
const uniqueSet = new Set(['unique']);

const dialog = [
    `You found a tiny creature! "Hi, I'm greg! It's nice to meet you! Please don't press the X button."`,
    `"Hi! Hello!"`,
    `"Hey! I'm here!"`,
    `"Hi, my name is Samuel. My friends call me Sam."`,
    `"My name is Genevieve. My hobbies include hanging by the pool, and tax evasion."`,
    `"Hi! Hello!"`,
    `"Hello there, friend!"`,
    `"Hey! I'm here!"`,
    `"Ahoy, matey!! Hehe"`,
    `"Hiii!!"`,
    `"Pressing Z in the air will use our secondary ability! Press shift to switch between abilities!"`,
    `"Gray guys stall you in the air."`,
];
let dialogIndex = 0;
function getDialog(): string {
    const nextDialog = dialog[dialogIndex];
    dialogIndex++;
    if (dialogIndex >= dialog.length) {
        dialogIndex = 5;
    }
    return nextDialog;
}

// A lil guy that follows the player
export class Guy extends RunningEntity {
    runSpeed = 1.5 * PHYSICS_SCALE * FPS;
    jumpSpeed = 4 * PHYSICS_SCALE * FPS;
    smallJumpSpeed = 1 * PHYSICS_SCALE * FPS;
    groundAccel = (0.35 * PHYSICS_SCALE * FPS * FPS) / 2;
    airAccel = (0.125 * PHYSICS_SCALE * FPS * FPS) / 2;
    gravity = 0.13 * PHYSICS_SCALE * FPS * FPS;

    w = physFromPx(3);
    h = physFromPx(3);

    reflexTime = lerp(0, 0.3, rng());
    jumpReflexTime = this.reflexTime + 0.1;
    reflexCount = 0;

    jumpCount = 0;
    tryingToJump = false;

    isTooFarCount = 0;
    maxIsTooFarCount = 1;
    exhausted = false;

    isUnique = false;

    closeness = lerp(physFromPx(5), physFromPx(15), rng());

    followingPlayer = false;

    type: GuyType = GuyType.Normal;

    update(dt: number): void {
        this.animCount += dt;

        if (this.jumpCount >= 0) {
            this.jumpCount -= dt;
        }

        if (this.isStanding()) {
            this.exhausted = false;
        }

        this.checkForPlayer();

        if (this.followingPlayer) {
            this.followPlayer(dt);
        }
        else {
            this.maybeSmallJump();
            this.dampX(dt);
        }

        this.limitFallSpeed(dt);
        this.applyGravity(dt);

        this.move(dt);
    }

    checkForPlayer() {
        // Check if we're near the player.
        if (!this.exhausted && this.isCloseEnoughToStop()) {
            // Add to available and known guys, if not already there.
            const [wasAdded, wasFirstAdded] = this.level.player.addGuy(this);
            // And start following the player.
            this.followingPlayer = true;

            if (wasAdded) {
                this.smallJump();
            }

            if (wasFirstAdded) {
                SFX.play('pickup');
                Notifications.addNotification(getDialog());
            }
            else if (wasAdded) {
                SFX.play('pickupAgain');
            }
        }
    }

    followPlayer(dt: number) {
        const player = this.level.player;
        // TODO: This could be replaced with proper pathfinding. For the moment, just move towards the player.
        if (this.midX < player.midX - this.closeness) {
            this.reflexCount += dt;
            if (this.reflexCount > this.reflexTime) {
                this.runRight(dt);
            }
        } else if (this.midX > player.midX + this.closeness) {
            this.reflexCount += dt;
            if (this.reflexCount > this.reflexTime) {
                this.runLeft(dt);
            }
        } else {
            this.reflexCount = 0;
            this.dampX(dt);
        }

        if (this.isTooFar()) {
            this.isTooFarCount += dt;
            if (this.isTooFarCount > this.maxIsTooFarCount) {
                this.teleportToPlayer();
            }
        } else {
            this.isTooFarCount = 0;
        }

        const playerIsAbove = player.maxY < this.maxY - 0.9 * TILE_SIZE;

        if (playerIsAbove) {
            if (!this.tryingToJump) {
                this.tryingToJump = true;
                this.jumpCount = this.jumpReflexTime;
            }
        } else {
            this.tryingToJump = false;
        }

        if (this.isStanding()) {
            if (this.tryingToJump && this.jumpCount <= 0 && playerIsAbove) {
                this.jump();
                this.tryingToJump = false;
                this.jumpCount = 0;
            } else {
                this.maybeSmallJump();
            }
        }
    }

    maybeSmallJump() {
        if (this.isStanding() && rng() < 0.03) {
            this.smallJump();
        }
    }

    teleportToPlayer() {
        this.midX = this.level.player.midX;
        this.maxY = this.level.player.maxY;
        this.dx = this.level.player.dx + lerp(-speedNoise, speedNoise, rng());
        this.dy = this.level.player.dy + lerp(-speedNoise, speedNoise, rng());
    }

    isTooFar() {
        // Less lenient in the y direction
        const yDiff = Math.abs(this.maxY - this.level.player.maxY);
        const xDiff = Math.abs(this.midX - this.level.player.midX);
        return yDiff > 1.5 * TILE_SIZE || xDiff > 8 * TILE_SIZE;
    }

    isCloseEnoughToShoot() {
        const yDiff = Math.abs(this.maxY - this.level.player.maxY);
        const xDiff = Math.abs(this.midX - this.level.player.midX);
        return xDiff < TILE_SIZE && yDiff < TILE_SIZE;
    }

    isCloseEnoughToJump() {
        const yDiff = Math.abs(this.maxY - this.level.player.maxY);
        const xDiff = Math.abs(this.midX - this.level.player.midX);
        return xDiff < 3 * TILE_SIZE && yDiff < 3 * TILE_SIZE;
    }

    isCloseEnoughToStop() {
        const yDiff = Math.abs(this.maxY - this.level.player.maxY);
        const xDiff = Math.abs(this.midX - this.level.player.midX);
        return xDiff < this.closeness && yDiff < physFromPx(8);
    }

    smallJump() {
        this.dy = -this.smallJumpSpeed;
    }

    jump() {
        this.dy = -this.jumpSpeed;
    }

    randomKnockback() {
        this.dy = -this.smallJumpSpeed;
        this.dx = lerp(-this.runSpeed, this.runSpeed, rng());
        this.facingDir = rng() < 0.5 ? FacingDir.Left : FacingDir.Right;
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

    maybeStopFollowingPlayer() {
        if (this.isUnique) {
            // Always follow the player.
        }
        else {
            this.followingPlayer = false;
        }
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
            layers: this.layerSet,
        });
    }

    get layerSet() {
        return this.isUnique ? uniqueSet : GuyType.sets[this.type];
    }
}
