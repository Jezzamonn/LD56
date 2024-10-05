import { Dir, FacingDir } from '../../../common';
import { FPS, physFromPx, PHYSICS_SCALE } from '../../../constants';
import { Aseprite } from '../../../lib/aseprite';
import { Guy } from '../guy';
import { RunningEntity } from '../running-entity';

export class Creature extends RunningEntity {
    w = physFromPx(13);
    h = physFromPx(10);

    runSpeed = 0.7 * PHYSICS_SCALE * FPS;
    hurtJumpSpeed = 1.5 * PHYSICS_SCALE * FPS;
    hurtXSpeed = 1.5 * PHYSICS_SCALE * FPS;

    health = 3;

    update(dt: number): void {
        this.animCount += dt;

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

        this.limitFallSpeed(dt);
        this.applyGravity(dt);

        this.move(dt);
    }

    hurt(dir: Dir): void {
        this.health--;
        const knockbackDir = Dir.toFacingDir(dir) ?? FacingDir.opposite(this.facingDir);
        this.dx = knockbackDir === FacingDir.Left ? -this.hurtXSpeed : this.hurtXSpeed;
        this.dy = -this.hurtJumpSpeed;

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        // TODO: Maybe some particles?
        // TODO: Also, sound effects.
        // Ooh yeah death animation would be good too.

        // Spawn a little guy! Actually lets add a few haha
        for (let i = 0; i < 3; i++) {
            const guy = new Guy(this.level);
            guy.midX = this.midX;
            guy.midY = this.midY;
            guy.randomKnockback();
            guy.type = 'normal';
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
        });
    }

    static async preload() {
        await Aseprite.loadImage({ name: 'creature', basePath: 'sprites' });
    }
}
