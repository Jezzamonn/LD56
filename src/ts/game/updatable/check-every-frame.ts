import { Updatable } from "./updatable";

export class CheckEveryFrame implements Updatable {

    done = false;

    private resolve: () => void;

    public readonly promise = new Promise<void>((resolve) => {
        this.resolve = resolve;
    });

    constructor(public condition: (dt: number) => boolean) {}

    update(dt: number) {
        if (this.condition(dt)) {
            this.done = true;
            this.resolve();
        }
    }

}