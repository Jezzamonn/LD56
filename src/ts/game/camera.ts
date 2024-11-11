import { Point } from "../common";
import { lerp } from "../lib/util";

export class Camera {
    constructor() {
    }

    update(dt: number) {}

    applyTransform(context: CanvasRenderingContext2D) {}
}

type TargetFunction = () => { x: number, y: number };

export class FocusCamera extends Camera {

    private targets: TargetFunction[] = [];

    private curPos: Point | undefined;

    constructor() {
        super();
    }

    pushTarget(targetFn: TargetFunction) {
        this.targets.push(targetFn);
    }

    popTarget() {
        // To be safe, don't ever pop the last target.
        if (this.targets.length <= 1) {
            console.error('Tried to pop last target from FocusCamera');
            return;
        }
        this.targets.pop();
    }

    update(dt: number) {
        const targetFn = this.targets[this.targets.length - 1];
        if (!targetFn) {
            return;
        }
        const targetPos = targetFn();
        if (!this.curPos) {
            this.curPos = targetPos;
            return;
        }

        const updateSmoothness = 1 - Math.exp(-3 * dt);
        this.curPos.x = lerp(this.curPos.x, targetPos.x, updateSmoothness);
        this.curPos.y = lerp(this.curPos.y, targetPos.y, updateSmoothness);
    }

    applyTransform(context: CanvasRenderingContext2D, scale=1) {
        if (this.curPos) {
            context.translate(Math.round(-scale * this.curPos.x), Math.round(-scale * this.curPos.y));
        }
    }
}

const screenPos: Point = { x: 0.5, y: 0.6 };

export function centerCanvas(context: CanvasRenderingContext2D) {
    context.translate(
        Math.round(context.canvas.width * screenPos.x),
        Math.round(context.canvas.height * screenPos.y));
}