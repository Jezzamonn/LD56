import { sfxr } from 'jsfxr';
import { MuteState, Sounds } from '../../lib/sounds';
import airStall from './air-stall.json';
import doubleJump from './double-jump.json';
import jump from './jump.json';
import land from './land.json';
import shootFire from './shoot-fire.json';
import shootNormal from './shoot-normal.json';

const sfx = {
    shootNormal,
    shootFire,
    jump,
    land,
    airStall,
    doubleJump,
};

class _SFX {
    sounds: { [key: string]: any } = {};

    preload() {
        for (let key in sfx) {
            this.sounds[key] = sfxr.toAudio(sfx[key]);
        }
    }

    play(name: string) {
        if (Sounds.muteState === MuteState.ALL_OFF) {
            return;
        }

        const sound = this.sounds[name];
        if (sound) {
            sound.play();
        }
    }
}

export const SFX = new _SFX();
