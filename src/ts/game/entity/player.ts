import { Dir, FacingDir, Point } from '../../common';
import {
    DOWN_KEYS,
    FPS,
    JUMP_KEYS,
    LEFT_KEYS,
    physFromPx,
    PHYSICS_SCALE,
    RIGHT_KEYS,
    SHOOT_KEYS,
    UP_KEYS
} from '../../constants';
import { Aseprite } from '../../lib/aseprite';
import { NullKeys } from '../../lib/keys';
import { SFX } from '../sfx';
import { ObjectTile } from '../tile/object-layer';
import { PhysicTile } from '../tile/tiles';
import { Bullet } from './bullet';
import { Guy } from './guy';
import { RunningEntity } from './running-entity';

const imageName = 'player';

// How long the player gets to jump after falling off a platform.
// 0.1 seems a little too lenient, but whatever :)
const COYOTE_TIME_SECS = 0.1;
const BUFFER_JUMP_TIME_SECS = 0.1;

export class Player extends RunningEntity {
    runSpeed = 1.5 * PHYSICS_SCALE * FPS;
    jumpSpeed = 3 * PHYSICS_SCALE * FPS;
    wallSlideSpeed = 1 * PHYSICS_SCALE * FPS;
    maxFallSpeed = 3 * PHYSICS_SCALE * FPS;

    groundAccel = (0.25 * PHYSICS_SCALE * FPS * FPS) / 2;
    airAccel = (0.125 * PHYSICS_SCALE * FPS * FPS) / 2;

    controlledByPlayer = true;

    // Used to track Coyote Time.
    onGroundCount = 0;
    onLeftWallCount = 0;
    onRightWallCount = 0;

    bufferedJumpCount = 0;

    bulletCooldown = 0.2;
    bulletCooldownCount = 0;

    w = physFromPx(6);
    h = physFromPx(16);

    lookingUp = false;
    lookingDown = false;

    guys: Guy[] = [];

    cameraFocus(): Point {
        // TODO: This made people dizzy, should adjust it / change the speed the camera moves.
        const facingMult = this.facingDir == FacingDir.Right ? 1 : -1;
        const facingOffset = facingMult * physFromPx(30) * 0; // disable for now.
        return { x: this.midX + facingOffset, y: this.maxY };
    }

    jump() {
        this.dy = -this.jumpSpeed;
        SFX.play('jump');
        // Reset coyote time variables.
        this.onGroundCount = 0;
        this.onLeftWallCount = 0;
        this.onRightWallCount = 0;
        this.bufferedJumpCount = 0;
    }

    update(dt: number) {
        this.animCount += dt;

        if (this.onGroundCount > 0) {
            this.onGroundCount -= dt;
        }
        if (this.onLeftWallCount > 0) {
            this.onLeftWallCount -= dt;
        }
        if (this.onRightWallCount > 0) {
            this.onRightWallCount -= dt;
        }
        if (this.bufferedJumpCount > 0) {
            this.bufferedJumpCount -= dt;
        }
        if (this.bulletCooldownCount > 0) {
            this.bulletCooldownCount -= dt;
        }

        if (this.isStanding()) {
            this.onGroundCount = COYOTE_TIME_SECS;
        }
        if (this.isAgainstLeftWall()) {
            this.onLeftWallCount = COYOTE_TIME_SECS;
        }
        if (this.isAgainstRightWall()) {
            this.onRightWallCount = COYOTE_TIME_SECS;
        }

        // TODO: Maybe checking what animation frame we're add and playing a sound effect (e.g. if it's a footstep frame.)

        let keys = this.controlledByPlayer
            ? this.level.game.keys
            : new NullKeys();

        const upPressed = keys.anyIsPressed(UP_KEYS);
        const downPressed = keys.anyIsPressed(DOWN_KEYS);
        this.lookingUp = upPressed && !downPressed;
        this.lookingDown = downPressed && !upPressed;

        if (keys.anyWasPressedThisFrame(JUMP_KEYS)) {
            this.bufferedJumpCount = BUFFER_JUMP_TIME_SECS;
        }

        if (this.bufferedJumpCount > 0) {
            if (this.onGroundCount > 0) {
                this.jump();
            } else if (this.onLeftWallCount > 0) {
                // Wall jump! To da right
                this.dx = this.runSpeed;
                this.facingDir = FacingDir.Right;
                this.jump();
            } else if (this.onRightWallCount > 0) {
                this.dx = -this.runSpeed;
                this.facingDir = FacingDir.Left;
                this.jump();
            }
        }

        const left = keys.anyIsPressed(LEFT_KEYS);
        const right = keys.anyIsPressed(RIGHT_KEYS);
        if (left && !right) {
            this.runLeft(dt);
        } else if (right && !left) {
            this.runRight(dt);
        } else {
            this.dampX(dt);
        }

        this.applyGravity(dt);
        this.limitFallSpeed(dt);
        this.move(dt);

        // Fire a bullet. After moving so that the facing direction is updated.
        if (keys.anyIsPressed(SHOOT_KEYS) && this.bulletCooldownCount <= 0) {
            this.fireBullet();
        }

        // Debug: Spawn a lil guy
        if (keys.wasPressedThisFrame('KeyG')) {
            this.spawnGuy();
        }

        // Checking for winning
        if (
            this.isTouchingTile(this.level.tiles.objectLayer, ObjectTile.Goal)
        ) {
            this.level.win();
        }
    }

    spawnGuy() {
        const guy = new Guy(this.level);
        guy.midX = this.midX;
        guy.maxY = this.minY;
        guy.type = 'unique';//rng() < 0.5 ? 'normal' : 'fire'
        this.level.addEntity(guy);
        this.guys.push(guy);
    }

    fireBullet() {
        // Can't fire without a guy!
        if (this.guys.length === 0) {
            return;
        }
        const guy = this.guys.shift()!;
        guy.done = true;

        const bullet = new Bullet(this.level);
        bullet.guy = guy;

        const facingDirMult = this.facingDir == FacingDir.Right ? 1 : -1;

        if (this.lookingUp) {
            bullet.midX = this.midX + facingDirMult * physFromPx(5);
            bullet.midY = this.midY - physFromPx(18);
            bullet.setDirection(Dir.Up);
        } else if (this.lookingDown) {
            bullet.midX = this.midX + facingDirMult * physFromPx(5);
            bullet.midY = this.midY + physFromPx(3);
            bullet.setDirection(Dir.Down);
        } else {
            bullet.setDirection(this.facingDir == FacingDir.Right ? Dir.Right : Dir.Left);
            bullet.midX = this.midX + facingDirMult * physFromPx(12);
            bullet.midY = this.midY + physFromPx(1);
        }

        this.level.addEntity(bullet);

        this.bulletCooldownCount = this.bulletCooldown;
    }

    limitFallSpeed(dt: number): void {
        const updateSmoothness = 1 - Math.exp(-20 * dt);
        if (this.isAgainstLeftWall() || this.isAgainstRightWall()) {
            if (this.dy > this.wallSlideSpeed) {
                const diff = this.dy - this.wallSlideSpeed;
                this.dy -= updateSmoothness * diff;
            }
            if (this.dy > 0) {
                this.facingDir = this.isAgainstLeftWall()
                    ? FacingDir.Right
                    : FacingDir.Left;
            }
        } else {
            if (this.dy > this.maxFallSpeed) {
                const diff = this.dy - this.maxFallSpeed;
                this.dy -= updateSmoothness * diff;
            }
        }
    }

    onDownCollision() {
        if (this.dy > 0.5 * this.jumpSpeed) {
            SFX.play('land');
        }
        super.onDownCollision();
    }

    isAgainstLeftWall() {
        return this.isTouchingTile(this.level.tiles, [PhysicTile.Wall], {
            dir: Dir.Left,
            offset: { x: -1, y: 0 },
        });
    }

    isAgainstRightWall() {
        return this.isTouchingTile(this.level.tiles, [PhysicTile.Wall], {
            dir: Dir.Right,
            offset: { x: 1, y: 0 },
        });
    }

    getAnimationName() {
        let animName = 'idle';
        let loop = true;

        if (!this.isStanding()) {
            if (this.dy > 0 && this.isAgainstLeftWall()) {
                animName = this.withLookSuffix('wall-slide');
            } else if (this.dy > 0 && this.isAgainstRightWall()) {
                animName = this.withLookSuffix('wall-slide');
            } else {
                animName = this.withLookSuffix('jump');
            }
        } else if (Math.abs(this.dx) > 0.01) {
            animName = this.withLookSuffix('run');
        } else {
            animName = this.withLookSuffix('idle');
        }
        return { animName, loop };
    }

    withLookSuffix(animName: string) {
        if (this.lookingUp) {
            return animName + '-up';
        } else if (this.lookingDown) {
            return animName + '-down';
        }
        return animName;
    }

    render(context: CanvasRenderingContext2D) {
        // super.render(context);

        const { animName, loop } = this.getAnimationName();

        Aseprite.drawAnimation({
            context,
            image: 'player',
            animationName: animName,
            time: this.animCount,
            position: { x: this.midX, y: this.maxY },
            scale: PHYSICS_SCALE,
            anchorRatios: { x: 0.5, y: 1 },
            flippedX: this.facingDir == FacingDir.Right,
            loop,
        });
    }

    static async preload() {
        await Aseprite.loadImage({ name: imageName, basePath: 'sprites' });
    }
}
