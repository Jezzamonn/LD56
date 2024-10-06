import { FPS, physFromPx, PHYSICS_SCALE } from "../../constants";
import { Aseprite } from "../../lib/aseprite";
import { lerp } from "../../lib/util";
import { Entity } from "./entity";
import { Guy } from "./guy";

export class Torch extends Entity {
    debugColor = "red";
    w = physFromPx(16);
    h = physFromPx(16);

    isActive = false;
    visible = true;

    touchingPlayerCount = 0;
    static touchingPlayerCooldown = 0.5;

    guysToBringBack: Guy[] = [];
    spawnCount = 0;
    static spawnCooldown = 0.1;

    update(dt: number): void {
        if (this.touchingPlayerCount > 0) {
            this.touchingPlayerCount -= dt;
        }

        if (this.spawnCount > 0) {
            this.spawnCount -= dt;
        }

        if (this.spawnCount <= 0) {
            this.bringBackAGuy();
        }

        super.update(dt);

        if (this.isTouchingEntity(this.level.player)) {
            if (this.touchingPlayerCount <= 0) {
                this.activate();
                this.guysToBringBack = this.level.player.knownGuys.slice();
            }
            this.touchingPlayerCount = Torch.touchingPlayerCooldown;
        }
    }

    bringBackAGuy() {
        const guy = this.guysToBringBack.pop();
        if (!guy) {
            return;
        }
        guy.done = false;
        guy.exhausted = false;
        guy.midX = this.midX;
        guy.midY = this.midY;
        guy.dx = lerp(-1 * PHYSICS_SCALE * FPS, 1 * PHYSICS_SCALE * FPS, Math.random());
        guy.dy = -1.5 * PHYSICS_SCALE * FPS;
        guy.followingPlayer = true;
        this.level.addEntity(guy);
        this.level.player.addGuy(guy);

        this.spawnCount = Torch.spawnCooldown;
    }

    render(context: CanvasRenderingContext2D): void {
        // super.render(context);

        if (!this.visible) {
            return;
        }

        const animationName = this.isActive ? "lit" : "unlit";

        Aseprite.drawAnimation({
            context,
            image: 'torch',
            animationName,
            time: this.animCount,
            position: { x: this.midX, y: this.maxY },
            scale: PHYSICS_SCALE,
            anchorRatios: { x: 0.5, y: 1 },
            loop: true,
        });
    }

    activate() {
        // Disactivate all other torches.
        for (const entity of this.level.entities) {
            if (entity instanceof Torch) {
                entity.isActive = false;
            }
        }
        this.isActive = true;
    }
}