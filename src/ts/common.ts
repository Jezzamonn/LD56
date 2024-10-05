export interface Point {
    x: number;
    y: number;
}

export enum Dir {
    Up,
    Down,
    Left,
    Right,
}

export namespace Dir {
    export function cornersInDirection(dir: Dir | undefined): Point[] {
        // What we have to multiply the width and height by to get the corners of an rectangle if the given direction.
        switch (dir) {
            case Dir.Up:
                return [{ x: 0, y: 0}, { x: 1, y: 0}]
            case Dir.Down:
                return [{ x: 0, y: 1}, { x: 1, y: 1}]
            case Dir.Left:
                return [{ x: 0, y: 0}, { x: 0, y: 1}]
            case Dir.Right:
                return [{ x: 1, y: 0}, { x: 1, y: 1}]
            default:
                // Every corner
                return [{ x: 0, y: 0}, { x: 1, y: 0}, { x: 0, y: 1}, { x: 1, y: 1}]
        }
    }

    export function toPoint(dir: Dir): Point {
        switch (dir) {
            case Dir.Up:
                return { x: 0, y: -1 };
            case Dir.Down:
                return { x: 0, y: 1 };
            case Dir.Left:
                return { x: -1, y: 0 };
            case Dir.Right:
                return { x: 1, y: 0 };
        }
    }

    export function toFacingDir(dir: Dir): FacingDir | undefined {
        switch (dir) {
            case Dir.Left:
                return FacingDir.Left;
            case Dir.Right:
                return FacingDir.Right;
            default:
                return undefined;
        }
    }
}

export enum FacingDir {
    Left,
    Right,
}

export namespace FacingDir {
    export function opposite(dir: FacingDir): FacingDir {
        return dir === FacingDir.Left ? FacingDir.Right : FacingDir.Left;
    }
}
