import { physFromPx } from "../../constants";
import { Entity } from "./entity";

export class Column extends Entity {
    w = physFromPx(16);
    h = physFromPx(32);

    update(dt: number): void {
        super.update(dt);
    }

}