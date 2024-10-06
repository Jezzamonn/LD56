import { Images } from "../lib/images";

export interface LevelInfo {
    name: string;
    song?: string;
}


export const LEVELS: LevelInfo[] = [
    {
        name: 'level',
    },
];

export class Levels {
    static preload(): Promise<any> {
        const promises: Promise<any>[] = [];
        for (const level of LEVELS) {
            promises.push(
                Images.loadImage({name: level.name, path: 'level/', extension: 'png'}),
            );
        }

        return Promise.all(promises);
    }
}