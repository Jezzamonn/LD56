import { Point } from "../../common";
import { seededRandom } from "../../lib/util";

export function tileRng(point: Point): () => number {
    return seededRandom(`${point.x},${point.y}`);
}
