import { Dir, FacingDir } from '../../../common';
import { FPS, physFromPx, PHYSICS_SCALE } from '../../../constants';
import { Aseprite } from '../../../lib/aseprite';
import { PhysicTile } from '../../tile/tiles';
import { Guy, GuyType } from '../guy';
import { RunningEntity } from '../running-entity';

export enum CreatureBehavior {
    Still,
    Running,
    CautiousRunning,
}

const recklessRunSpeed = 1.0 * PHYSICS_SCALE * FPS;
const cautiousRunSpeed = 0.7 * PHYSICS_SCALE * FPS;

export class Creature extends RunningEntity {
    w = physFromPx(13);
    h = physFromPx(10);

    runSpeed = 1.0 * PHYSICS_SCALE * FPS;
    hurtJumpSpeed = 1.5 * PHYSICS_SCALE * FPS;
    hurtXSpeed = 1.5 * PHYSICS_SCALE * FPS;

    health = 3;

    behavior = CreatureBehavior.Running;
    startedRunning = false;
    distToAwaken = physFromPx(100);

    type: GuyType = GuyType.Normal;

    update(dt: number): void {
        this.animCount += dt;

        switch (this.behavior) {
            case CreatureBehavior.Still:
                this.dampX(dt);
                break;
            case CreatureBehavior.Running:
                this.runSpeed = recklessRunSpeed;
                this.updateRunning(dt);
                break;
            case CreatureBehavior.CautiousRunning:
                this.runSpeed = cautiousRunSpeed;
                this.updateCautiousRunning(dt);
                break;
        }

        this.limitFallSpeed(dt);
        this.applyGravity(dt);

        this.move(dt);
    }

    updateRunning(dt: number): void {
        this.checkPlayerDist();

        if (this.startedRunning) {
            if (this.isStanding()) {
                if (this.facingDir == FacingDir.Left) {
                    this.runLeft(dt);
                }
                else {
                    this.runRight(dt);
                }
            }
            else {
                this.dampX(dt);
            }
        }
    }

    updateCautiousRunning(dt: number): void {
        this.checkPlayerDist();

        if (this.startedRunning) {
            if (this.isStanding()) {
                // Check the position a little bit ahead, if it's empty, turn around to avoid falling.
                const facingDirMult = this.facingDir === FacingDir.Left ? -1 : 1;
                const checkX = this.midX + facingDirMult * this.w / 2;
                const checkY = this.maxY + 1;
                const tile = this.level.tiles.getTileAtCoord({x: checkX, y: checkY});
                if (tile === PhysicTile.Empty) {
                    this.facingDir = FacingDir.opposite(this.facingDir);
                }

                if (this.facingDir == FacingDir.Left) {
                    this.runLeft(dt);
                }
                else {
                    this.runRight(dt);
                }
            }
            else {
                this.dampX(dt);
            }
        }
    }

    checkPlayerDist() {
        if (!this.startedRunning) {
            const xDistToPlayer = this.level.player.midX - this.midX;
            const yDistToPlayer = this.level.player.midY - this.midY;
            if (Math.abs(xDistToPlayer) < this.distToAwaken && Math.abs(yDistToPlayer) < this.distToAwaken) {
                this.startedRunning = true;
            }
        }
    }

    hurt(dir: Dir): void {
        this.health--;
        // TODO: Graphics.

        // const knockbackDir = Dir.toFacingDir(dir) ?? FacingDir.opposite(this.facingDir);
        // this.dx = knockbackDir === FacingDir.Left ? -this.hurtXSpeed : this.hurtXSpeed;
        // this.dy = -this.hurtJumpSpeed;

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        // TODO: Maybe some particles?
        // TODO: Also, sound effects.
        // Ooh yeah death animation would be good too.

        // Spawn a little guy! Actually lets add a few haha
        for (let i = 0; i < 1; i++) {
            const guy = new Guy(this.level);
            guy.midX = this.midX;
            guy.midY = this.midY;
            guy.randomKnockback();
            guy.type = this.type;
            this.level.addEntity(guy);
        }

        this.done = true;
    }

    onLeftCollision(): void {
        super.onLeftCollision();
        this.facingDir = FacingDir.Right;
    }

    onRightCollision(): void {
        super.onRightCollision();
        this.facingDir = FacingDir.Left;
    }

    render(context: CanvasRenderingContext2D): void {
        const animationName = this.dx === 0 ? 'idle' : 'run';

        Aseprite.drawAnimation({
            context,
            image: 'creature',
            animationName,
            time: this.animCount,
            position: { x: this.midX, y: this.maxY },
            scale: PHYSICS_SCALE,
            anchorRatios: { x: 0.5, y: 1 },
            flippedX: this.facingDir === FacingDir.Right,
            loop: true,
            layers: GuyType.sets[this.type],
        });
    }
}
