import { seededRandom } from "./lib/util";

export const DEBUG = false;

// Multiple for the fixed-point physics.
export const PHYSICS_SCALE = 16;
export const FPS = 60;
export const TIME_STEP = 1 / FPS;

export const PIXEL_SCALE = 4;

export const GAME_WIDTH_PX = 210;
export const GAME_HEIGHT_PX = 160;
export const GAME_WIDTH = GAME_WIDTH_PX * PHYSICS_SCALE;
export const GAME_HEIGHT = GAME_HEIGHT_PX * PHYSICS_SCALE;

export const TILE_SIZE_PX = 16;
export const TILE_SIZE = TILE_SIZE_PX * PHYSICS_SCALE;

export const LEFT_KEYS = ['KeyA', 'ArrowLeft'];
export const RIGHT_KEYS = ['KeyD', 'ArrowRight'];
export const UP_KEYS = ['KeyW', 'ArrowUp'];
export const DOWN_KEYS = ['KeyS', 'ArrowDown'];

// TODO: Allow this to be configurable somehow.
export const JUMP_KEYS = ['Space', 'KeyZ', "KeyJ"];
export const SHOOT_KEYS = ['KeyX', 'ShiftRight', "KeyK"];
export const SWITCH_WEAPON_KEYS = ['ShiftLeft', 'KeyL'];

export const SELECT_KEYS = ['Enter', ...JUMP_KEYS, ...SHOOT_KEYS, ...SWITCH_WEAPON_KEYS];
export const TITLE_KEYS = ['Space', 'Enter'];
export const RESTART_KEYS = ['KeyR'];

export const HURT_FILTER = 'contrast(0%) brightness(2)';
export const HURT_FLASH_TIME = 0.1;

export function physFromPx(x: number): number {
    return x * PHYSICS_SCALE;
}

export function pxFromPhys(x: number): number {
    return Math.floor(x / PHYSICS_SCALE);
}

// Not really a constant :)
export const rng = seededRandom("blah bloo blee blah");