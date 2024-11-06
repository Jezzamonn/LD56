export interface UiStackElement {
    update(dt: number): void;
    render?(context: CanvasRenderingContext2D): void;

    done?: boolean;
}