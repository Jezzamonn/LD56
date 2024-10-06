import { physFromPx } from "../../../constants";
import { Entity } from "../entity";

export class Spider extends Entity {
    w = physFromPx(25);
    h = physFromPx(20);

    render(context: CanvasRenderingContext2D) {
        super.render(context);

        // Aseprite.drawAnimation({
        //     context,
        //     image: 'player',
        //     animationName: animName,
        //     time: this.animCount,
        //     position: { x: this.midX, y: this.maxY },
        //     scale: PHYSICS_SCALE,
        //     anchorRatios: { x: 0.5, y: 1 },
        //     flippedX: this.facingDir == FacingDir.Right,
        //     loop,
        // });
    }
}