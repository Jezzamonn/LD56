import {
    DEBUG,
    GAME_HEIGHT_PX,
    GAME_WIDTH_PX,
    PHYSICS_SCALE,
    RESTART_KEYS,
    TIME_STEP,
} from '../constants';
import { Aseprite } from '../lib/aseprite';
import { ComboKeys, KeyboardKeys, NullKeys, RegularKeys } from '../lib/keys';
import { Sounds } from '../lib/sounds';
import { Background } from './background';
import { centerCanvas } from './camera';
import { Level } from './level';
import { Levels, LEVELS } from './levels';
import { SFX } from './sfx';
import { Tiles } from './tile/tiles';

export class Game {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;

    scale = 1;

    simulatedTimeMs: number | undefined;

    levelIndex = 0;
    showingTitle = true;
    curLevel: Level | undefined;

    keys: RegularKeys;
    nullKeys = new NullKeys();

    constructor(canvasSelector: string) {
        const canvas =
            document.querySelector<HTMLCanvasElement>(canvasSelector);
        if (!canvas) {
            throw new Error(
                `Could not find canvas with selector ${canvasSelector}`
            );
        }
        const context = canvas.getContext('2d')!;

        this.canvas = canvas;
        this.context = context;

        // TODO: Support touch keys again.
        this.keys = new ComboKeys(new KeyboardKeys());

        Sounds.loadMuteState();
    }

    start() {
        this.keys.setUp();

        Aseprite.disableSmoothing(this.context);

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Whenever any touch event happens, try to enter fullscreen.
        window.addEventListener('touchstart', () => this.enterFullscreen());

        this.doAnimationLoop();

        this.startLevel(0);

        if (DEBUG) {
            this.loadPlayerPosition();
        }
    }

    nextLevel() {
        this.startLevel((this.levelIndex + 1) % LEVELS.length);
    }

    prevLevel() {
        this.startLevel((this.levelIndex + LEVELS.length - 1) % LEVELS.length);
    }

    startLevel(levelIndex: number) {
        this.levelIndex = levelIndex;
        const levelInfo = LEVELS[this.levelIndex];
        const level = new Level(this, levelInfo);
        level.initFromImage();
        this.curLevel = level;

        // if (levelInfo.song) {
        //     Sounds.setSong(levelInfo.song);
        // }
    }

    win() {
        this.nextLevel();
    }

    doAnimationLoop() {
        if (this.simulatedTimeMs == undefined) {
            this.simulatedTimeMs = Date.now();
        }

        let curTime = Date.now();
        let updateCount = 0;
        while (this.simulatedTimeMs < curTime) {
            this.update(TIME_STEP);

            this.simulatedTimeMs += 1000 * TIME_STEP;

            updateCount++;
            if (updateCount > 10) {
                this.simulatedTimeMs = curTime;
                break;
            }
        }

        this.render();

        requestAnimationFrame(() => this.doAnimationLoop());
    }

    handleInput() {
        if (this.keys.wasPressedThisFrame('KeyM')) {
            // Mute
            Sounds.toggleMute();
        }
        if (DEBUG) {
            if (this.keys.wasPressedThisFrame('Comma')) {
                this.prevLevel();
            }
            if (this.keys.wasPressedThisFrame('Period')) {
                this.nextLevel();
            }
            // Ignore if any control keys are pressed.
            if (
                this.keys.anyWasPressedThisFrame(RESTART_KEYS) &&
                !this.keys.anyIsPressed(['ControlLeft', 'ControlRight', 'MetaLeft', 'MetaRight'])
            ) {
                this.startLevel(this.levelIndex);
            }
        }
    }

    update(dt: number) {
        try {
            this.handleInput();

            this.curLevel?.update(dt);

            this.keys.resetFrame();

            if (DEBUG) {
                // To make play testing quicker, save the last position of the player.
                this.savePlayerPosition();
            }
        } catch (e) {
            console.error(e);
        }
    }

    savePlayerPosition() {
        const localStoragePrefix = 'ihaveputthecreatureintomygun';
        const player = this.curLevel?.player;
        if (player) {
            const key = `${localStoragePrefix}-last-player-position`;
            localStorage.setItem(
                key,
                JSON.stringify({ x: player.midX, y: player.maxY })
            );
        }
    }

    loadPlayerPosition() {
        const localStoragePrefix = 'ihaveputthecreatureintomygun';
        const key = `${localStoragePrefix}-last-player-position`;
        const json = localStorage.getItem(key);
        if (!json) {
            return;
        }
        const { x, y } = JSON.parse(json);
        const player = this.curLevel?.player;
        if (player) {
            player.midX = x;
            player.maxY = y;
        }
    }

    applyScale(context: CanvasRenderingContext2D) {
        context.scale(this.scale, this.scale);
    }

    render() {
        this.context.resetTransform();
        centerCanvas(this.context);
        this.applyScale(this.context);

        try {
            this.curLevel?.render(this.context);
        } catch (e) {
            console.error(e);
        }
    }

    resize() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const pixelScale = window.devicePixelRatio || 1;

        // Set canvas size
        const xScale = windowWidth / GAME_WIDTH_PX;
        const yScale = windowHeight / GAME_HEIGHT_PX;

        // Math.min = scale to fit
        const pxScale = Math.floor(Math.min(xScale, yScale) * pixelScale);
        this.scale = pxScale / PHYSICS_SCALE;

        document.body.style.setProperty('--scale', `${pxScale / pixelScale}`);

        this.canvas.width = windowWidth * pixelScale;
        this.canvas.height = windowHeight * pixelScale;
        this.canvas.style.width = `${windowWidth}px`;
        this.canvas.style.height = `${windowHeight}px`;
        // Need to call this again when the canvas size changes.
        Aseprite.disableSmoothing(this.context);

        // Set HTML element size
        document.body.style.setProperty('--pageWidth', `${windowWidth}px`);
        document.body.style.setProperty('--pageHeight', `${windowHeight}px`);
    }

    enterFullscreen() {
        // If we're already fullscreen, don't do anything.
        if (document.fullscreenElement) {
            return;
        }

        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        }
    }

    static async preload() {
        const sprites = ['player', 'lilguy', 'creature', 'torch', 'column'];
        const spritePromises = sprites.map((name) => Aseprite.loadImage({ name, basePath: 'sprites' }));
        await Promise.all([
            Levels.preload(),
            Tiles.preload(),
            Background.preload(),
            ...spritePromises,
        ]);
        SFX.preload();
    }
}
