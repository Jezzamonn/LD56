import { FacingDir } from "../../common";
import { FPS, PHYSICS_SCALE } from "../../constants";
import { Entity } from "./entity";

export class RunningEntity extends Entity {
    runSpeed = 1.5 * PHYSICS_SCALE * FPS;

    groundAccel = (0.25 * PHYSICS_SCALE * FPS * FPS) / 2;
    airAccel = (0.125 * PHYSICS_SCALE * FPS * FPS) / 2;
    gravity = 0.13 * PHYSICS_SCALE * FPS * FPS;

    dampX(dt: number): void {
        this.xDampAmt = this.isStanding() ? this.groundAccel : this.airAccel;
        super.dampX(dt);
    }

    runLeft(dt: number) {
        const accel = this.isStanding() ? this.groundAccel : this.airAccel;
        this.dx -= accel * dt;
        if (this.dx < -this.runSpeed) {
            this.dx = -this.runSpeed;
        }
        this.facingDir = FacingDir.Left;
    }

    runRight(dt: number) {
        const accel = this.isStanding() ? this.groundAccel : this.airAccel;
        this.dx += accel * dt;
        if (this.dx > this.runSpeed) {
            this.dx = this.runSpeed;
        }
        this.facingDir = FacingDir.Right;
    }
}