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
    UP_KEYS,
} from '../../constants';
import { Aseprite } from '../../lib/aseprite';
import { SFX } from '../sfx';
import { PhysicTile } from '../tile/tiles';
import { Bullet } from './bullet';
import { Creature } from './enemies/creature';
import { Guy, GuyType } from './guy';
import { RunningEntity } from './running-entity';
import { Torch } from './torch';

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

    // Used to track Coyote Time.
    onGroundCount = 0;

    needToReleaseJumpKeyToDoubleJump = true;

    bulletCooldown = 0.15;
    bulletCooldownCount = 0;

    w = physFromPx(6);
    h = physFromPx(16);

    lookingUp = false;
    lookingDown = false;

    availableGuys: Guy[] = [];
    availableGuysSet = new Set<Guy>();
    knownGuys: Guy[] = [];
    knownGuysSet = new Set<Guy>();

    isDead = false;

    cameraFocus(): Point {
        // TODO: This made people dizzy, should adjust it / change the speed the camera moves.
        const facingMult = this.facingDir == FacingDir.Right ? 1 : -1;
        const facingOffset = facingMult * physFromPx(30) * 0; // disable for now.
        return { x: this.midX + facingOffset, y: this.maxY };
    }

    jump() {
        this.dy = -this.jumpSpeed;
        this.needToReleaseJumpKeyToDoubleJump = true;
        SFX.play('jump');
        // Reset coyote time variables.
        this.onGroundCount = 0;
    }

    update(dt: number) {
        this.animCount += dt;

        if (this.onGroundCount > 0) {
            this.onGroundCount -= dt;
        }
        if (this.bulletCooldownCount > 0) {
            this.bulletCooldownCount -= dt;
        }

        if (this.isStanding()) {
            this.onGroundCount = COYOTE_TIME_SECS;
        }

        // TODO: Maybe checking what animation frame we're add and playing a sound effect (e.g. if it's a footstep frame.)

        this.checkEnemyCollision();

        this.handlePreMovementInput(dt);

        this.limitFallSpeed(dt);
        this.applyGravity(dt);
        this.move(dt);

        this.handlePostMovementInput(dt);
    }

    handlePreMovementInput(dt: number) {
        const keys = this.level.game.keys;

        if (this.isDead) {
            this.dampX(dt);
            return;
        }

        const upPressed = keys.anyIsPressed(UP_KEYS);
        const downPressed = keys.anyIsPressed(DOWN_KEYS);
        this.lookingUp = upPressed && !downPressed;
        this.lookingDown = downPressed && !upPressed;

        // Need to release the jump key before jumping again.
        if (this.onGroundCount > 0) {
            this.needToReleaseJumpKeyToDoubleJump = true;
        } else if (!keys.anyIsPressed(JUMP_KEYS)) {
            this.needToReleaseJumpKeyToDoubleJump = false;
        }

        if (keys.anyWasPressedThisFrame(JUMP_KEYS) && this.onGroundCount > 0) {
            this.jump();
        } else if (keys.anyIsPressed(JUMP_KEYS) && !this.needToReleaseJumpKeyToDoubleJump) {
            // Use 'bullets' as double jumps.
            if (this.bulletCooldownCount <= 0) {
                this.bulletDoubleJump();
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
    }

    handlePostMovementInput(dt: number) {
        const keys = this.level.game.keys;

        // Debug: Spawn a lil guy
        if (keys.wasPressedThisFrame('KeyG')) {
            this.spawnGuy();
        }
        if (keys.wasPressedThisFrame('KeyB')) {
            this.bringBackAllGuys();
        }

        if (this.isDead) {
            if (keys.anyWasPressedThisFrame(JUMP_KEYS)) {
                this.respawn();
            }
            return;
        }

        // Fire a bullet. After moving so that the facing direction is updated.
        if (keys.anyIsPressed(SHOOT_KEYS) && this.bulletCooldownCount <= 0) {
            this.fireBullet();
        }
    }

    respawn() {
        // Find a lit torch in the level, respawn there.
        const torches = this.level.getEntities(Torch);
        for (let torch of torches) {
            if (torch.isActive) {
                this.respawnAtTorch(torch);
                return;
            }
        }
        this.respawnAtTorch(torches[0]);
    }

    respawnAtTorch(torch: Torch) {
        this.midX = torch.midX;
        this.maxY = torch.maxY;
        this.dx = 0;
        this.dy = 0;
        this.isDead = false;
    }

    spawnGuy() {
        const guy = new Guy(this.level);
        guy.midX = this.midX;
        guy.maxY = this.minY;
        if (this.knownGuys.length == 0) {
            guy.type = GuyType.Unique;
        } else if (this.knownGuys.length < 3) {
            guy.type = GuyType.Normal;
        }
        else {
            guy.type = GuyType.Fire;
        }
        this.level.addEntity(guy);
    }

    bringBackAllGuys() {
        for (let guy of this.knownGuys) {
            guy.done = false;
            guy.exhausted = false;
            guy.midX = this.midX;
            guy.maxY = this.maxY;
            guy.dx = 0;
            guy.dy = 0;
            this.level.addEntity(guy);
            this.addGuy(guy);
        }
    }

    addGuy(guy: Guy): boolean {
        const wasAlreadyAvailable = this.availableGuysSet.has(guy);
        if (!this.availableGuysSet.has(guy)) {
            this.availableGuysSet.add(guy);
            this.availableGuys.push(guy);
        }
        if (!this.knownGuysSet.has(guy)) {
            this.knownGuysSet.add(guy);
            this.knownGuys.push(guy);
        }

        return !wasAlreadyAvailable;
    }

    popAvailableGuy(): Guy | undefined {
        const guy = this.availableGuys.shift();
        if (guy) {
            this.availableGuysSet.delete(guy);
            guy.exhausted = true;
        }
        return guy;
    }

    nextAvailableGuy(): Guy | undefined {
        return this.availableGuys[0];
    }

    fireBullet() {
        const guy = this.popAvailableGuy();
        if (!guy) {
            // Can't fire without a guy!
            return;
        }

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
            bullet.setDirection(
                this.facingDir == FacingDir.Right ? Dir.Right : Dir.Left
            );
            bullet.midX = this.midX + facingDirMult * physFromPx(12);
            bullet.midY = this.midY + physFromPx(1);
        }

        this.level.addEntity(bullet);

        this.bulletCooldownCount = this.bulletCooldown;
    }

    bulletDoubleJump() {
        const guy = this.popAvailableGuy();
        if (!guy) {
            // Can't fire without a guy!
            return;
        }

        // Push him away.
        if (guy.type === GuyType.Unique) {
            guy.maybeStopFollowingPlayer();
            guy.midX = this.midX;
            guy.maxY = this.midY + 1;
            guy.dy = -0.5 * this.jumpSpeed;
            const facingDirMult = this.facingDir == FacingDir.Right ? 1 : -1;
            guy.dx = -facingDirMult * 0.5 * this.runSpeed;
        }
        else {
            // Removed. Sorry!
            guy.done = true;
        }

        // Some double jump effect.

        switch (guy.type) {
            case 'unique':
            case 'normal':
                this.dy = Math.min(this.dy, 0);
                break;
            case 'fire':
                // Straight up double jump.
                this.jump();
                break;
        }

        const nextGuy = this.nextAvailableGuy();
        if (nextGuy?.type === GuyType.Fire) {
            this.needToReleaseJumpKeyToDoubleJump = true;
        }

        // // TODO: This feels like it needs to be balanced more... Hm.
        // this.dy -= 0.23 * this.jumpSpeed;

        // Just stall in mid air, for the moment.


        this.bulletCooldownCount = this.bulletCooldown;
    }

    checkEnemyCollision() {
        for (let entity of this.level.entities) {
            if (entity instanceof Creature) {
                if (this.isTouchingEntity(entity)) {
                    this.hurt();
                    break;
                }
            }
        }
    }

    hurt() {
        if (this.isDead) {
            return;
        }
        this.isDead = true;
        this.animCount = 0;
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

        if (this.isDead) {
            animName = 'hurt';
            loop = false;
        } else if (!this.isStanding()) {
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
}
