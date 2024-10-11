import { CheckEveryFrame } from './check-every-frame';

export class FrameCounter extends CheckEveryFrame {
    private count = 0;
    done = false;

    constructor(public length: number) {
        super((dt: number) => {
            this.count += dt;
            return this.count >= this.length;
        });
    }
}
