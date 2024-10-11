export interface Updatable {
    update(dt: number): void;

    done: boolean;
}