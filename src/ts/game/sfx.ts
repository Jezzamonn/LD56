import { sfxr } from 'jsfxr';
import { MuteState, Sounds } from '../lib/sounds';

const sfx = {
    shoot: {
        oldParams: true,
        wave_type: 0,
        p_env_attack: 0,
        p_env_sustain: 0.04632118905642679,
        p_env_punch: 0,
        p_env_decay: 0.1707948208470867,
        p_base_freq: 0.5814143368418435,
        p_freq_limit: 0,
        p_freq_ramp: -0.36973927115188066,
        p_freq_dramp: 0,
        p_vib_strength: 0,
        p_vib_speed: 0,
        p_arp_mod: 0,
        p_arp_speed: 0,
        p_duty: 0.02593663996805513,
        p_duty_ramp: 0,
        p_repeat_speed: 0,
        p_pha_offset: 0,
        p_pha_ramp: 0,
        p_lpf_freq: 1,
        p_lpf_ramp: 0,
        p_lpf_resonance: 0,
        p_hpf_freq: 0.11536376385441355,
        p_hpf_ramp: 0,
        sound_vol: 0.25,
        sample_rate: 44100,
        sample_size: 8,
    },
    land: {
        oldParams: true,
        wave_type: 1,
        p_env_attack: 0,
        p_env_sustain: 0.07352360049425717,
        p_env_punch: 0,
        p_env_decay: 0.147,
        p_base_freq: 0.421,
        p_freq_limit: 0.124,
        p_freq_ramp: -0.396,
        p_freq_dramp: 0,
        p_vib_strength: 0,
        p_vib_speed: 0,
        p_arp_mod: 0,
        p_arp_speed: 0,
        p_duty: 1,
        p_duty_ramp: 0,
        p_repeat_speed: 0,
        p_pha_offset: 0,
        p_pha_ramp: 0,
        p_lpf_freq: 0.808,
        p_lpf_ramp: 0,
        p_lpf_resonance: 0,
        p_hpf_freq: 0.261,
        p_hpf_ramp: 0,
        sound_vol: 0.25,
        sample_rate: 44100,
        sample_size: 8,
    },
    jump: {
        oldParams: true,
        wave_type: 0,
        p_env_attack: 0,
        p_env_sustain: 0.17777406617732028,
        p_env_punch: 0,
        p_env_decay: 0.10845619574688228,
        p_base_freq: 0.30882853817847383,
        p_freq_limit: 0,
        p_freq_ramp: 0.25544643733503697,
        p_freq_dramp: 0,
        p_vib_strength: 0,
        p_vib_speed: 0,
        p_arp_mod: 0,
        p_arp_speed: 0,
        p_duty: 0.5317914113939791,
        p_duty_ramp: 0,
        p_repeat_speed: 0,
        p_pha_offset: 0,
        p_pha_ramp: 0,
        p_lpf_freq: 0.5581580570105902,
        p_lpf_ramp: 0,
        p_lpf_resonance: 0,
        p_hpf_freq: 0,
        p_hpf_ramp: 0,
        sound_vol: 0.25,
        sample_rate: 44100,
        sample_size: 8,
    },
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
