import {
    DEBUG,
    FPS,
    GAME_HEIGHT_PX,
    GAME_WIDTH_PX,
    HURT_FILTER,
    PHYSICS_SCALE,
    RESTART_KEYS,
    SELECT_KEYS,
    TILE_SIZE,
    TIME_STEP,
} from '../constants';
import { Aseprite } from '../lib/aseprite';
import { ComboKeys, KeyboardKeys, NullKeys, RegularKeys } from '../lib/keys';
import { Sounds } from '../lib/sounds';
import { Background } from './background';
import { centerCanvas } from './camera';
import { Level } from './level';
import { SFX } from './sfx/sfx';
import { Tiles } from './tile/tiles';
import { CreatureWidget } from './ui/creature-widget';
import { Notifications } from './ui/notification';
import { UiStackElement } from './ui/ui-stack-element';
import { CheckEveryFrame } from './updatable/check-every-frame';
import { FrameCounter } from './updatable/frame-counter';
import { Updatable } from './updatable/updatable';

export class Game {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;

    scale = 1;

    simulatedTimeMs: number | undefined;

    levelIndex = 0;
    level: Level;
    uiAndLevelStack: UiStackElement[] = [];

    keys: RegularKeys;
    nullKeys = new NullKeys();

    slowMoFactor = 1;
    skipMainUpdate = false;

    cutscenePromise: Promise<void> | undefined;

    updatables: Updatable[] = [];

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

        this.keys = this.nullKeys;

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

        this.startLevel();

        if (DEBUG) {
            this.level.loadPlayerPosition();
        }
    }

    startPlaying() {
        // TODO: Some default cutscene.

        // TODO: Support touch keys again.
        this.keys = new ComboKeys(new KeyboardKeys());
        this.keys.setUp();

        Notifications.addNotification(
            'Use the arrow keys to move, and Z to jump.',
            this.waitFor(() => {
                const dx = this.level.playerStart.x - this.level.player.x;
                return Math.abs(dx) > 3 * TILE_SIZE;
            })
        );
    }

    startLevel() {
        this.level = new Level(this);
        this.level.init();
        this.uiAndLevelStack = [this.level];
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
            // Ignore if any control keys are pressed.
            if (
                this.keys.anyWasPressedThisFrame(RESTART_KEYS) &&
                !this.keys.anyIsPressed([
                    'ControlLeft',
                    'ControlRight',
                    'MetaLeft',
                    'MetaRight',
                ])
            ) {
                this.startLevel();
            }
        }
    }

    update(dt: number) {
        try {
            this.handleInput();

            for (let i = 0; i < this.updatables.length; i++) {
                this.updatables[i].update(dt);
                if (this.updatables[i].done) {
                    this.updatables.splice(i, 1);
                    i--;
                }
            }

            if (!this.skipMainUpdate) {
                const currentUi =
                    this.uiAndLevelStack[this.uiAndLevelStack.length - 1];
                currentUi.update(dt * this.slowMoFactor);
                if (currentUi.done) {
                    this.uiAndLevelStack.pop();
                }
            }

            this.keys.resetFrame();
        } catch (e) {
            console.error(e);
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
            for (const ui of this.uiAndLevelStack) {
                ui.render?.(this.context);
            }
        } catch (e) {
            console.error(e);
        }
    }

    resize() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const subPixelScale = window.devicePixelRatio || 1;

        // Set canvas size
        const xScale = windowWidth / GAME_WIDTH_PX;
        const yScale = windowHeight / GAME_HEIGHT_PX;

        // Math.min = scale to fit
        const pxScale = Math.floor(Math.min(xScale, yScale) * subPixelScale);
        this.scale = pxScale / PHYSICS_SCALE;

        document.body.style.setProperty('--scale', `${pxScale / subPixelScale}`);

        // // Debug: Restricts the canvas size to the size that can be normally seen.
        // this.canvas.width = GAME_WIDTH_PX * pxScale;
        // this.canvas.height = GAME_HEIGHT_PX * pxScale;
        // this.canvas.style.width = `${GAME_WIDTH_PX * pxScale / subPixelScale}px`;
        // this.canvas.style.height = `${GAME_HEIGHT_PX * pxScale / subPixelScale}px`;

        this.canvas.width = windowWidth * subPixelScale;
        this.canvas.height = windowHeight * subPixelScale;
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
        const spritesPromise = Aseprite.loadImages([
            { name: 'player', basePath: 'sprites', filters: [HURT_FILTER] },
            { name: 'creature', basePath: 'sprites', filters: [HURT_FILTER] },
            { name: 'lilguy', basePath: 'sprites' },
            { name: 'torch', basePath: 'sprites' },
            { name: 'column', basePath: 'sprites' },
            { name: 'grass', basePath: 'sprites' },
            { name: 'waterfall', basePath: 'sprites' },
        ]);

        const music = ['exploring'];
        const musicPromises = music.map((name) =>
            Sounds.loadSound({ name, path: 'music/' })
        );

        await Promise.all([
            Tiles.preload(),
            Background.preload(),
            spritesPromise,
            ...musicPromises,
        ]);
        SFX.preload();
    }

    wait(seconds: number): Promise<void> {
        const frameCounter = new FrameCounter(seconds);
        this.updatables.push(frameCounter);
        return frameCounter.promise;
    }

    waitForFrames(frames: number): Promise<void> {
        return this.wait(frames / FPS);
    }

    waitForKeyPress(keys: string[]): Promise<void> {
        const keyPressCheck = new CheckEveryFrame(() =>
            this.keys.anyWasPressedThisFrame(keys)
        );
        this.updatables.push(keyPressCheck);
        return keyPressCheck.promise;
    }

    waitFor(predicate: () => boolean): Promise<void> {
        const check = new CheckEveryFrame(predicate);
        this.updatables.push(check);
        return check.promise;
    }

    // Cutscene stuff
    showTitle() {
        this.cutscenePromise = this.titleScreenCutscene();
    }

    private async titleScreenCutscene() {
        Notifications.clear();

        await this.waitForFrames(2);

        this.skipMainUpdate = true;
        const titleElem = document.querySelector('.title')!;
        titleElem.classList.remove('hidden');

        await Promise.race([this.wait(1), this.waitForKeyPress(SELECT_KEYS)]);

        const h2Elem = titleElem.querySelector('h2')!;
        h2Elem.classList.remove('invisible');
        SFX.play('explode');

        await Promise.race([this.wait(2), this.waitForKeyPress(SELECT_KEYS)]);

        const pElem1 = titleElem.querySelectorAll('p')[0]!;
        pElem1.classList.remove('invisible');
        SFX.play('explode');

        const closeKeyPress = this.waitForKeyPress(SELECT_KEYS);

        await Promise.race([this.wait(2), closeKeyPress]);

        const pElem2 = titleElem.querySelectorAll('p')[1]!;
        pElem2.classList.remove('invisible');

        await closeKeyPress;

        this.skipMainUpdate = false;
        titleElem.classList.add('hidden');
        Sounds.setSong('exploring');
    }

    startHowToSwitchGuyCutscene() {
        this.cutscenePromise = this.howToSwitchGuyCutscene();
    }

    private async howToSwitchGuyCutscene() {
        // Add message spoken by the new guy.
        Notifications.addNotification(
            '"Oh hey there! First time meeting a creature like me?<br><br>Press shift to switch what type of guy you have equipped."',
            // Never hide, because the cutscene will hide it for us.
            new Promise(() => {})
        );

        await this.waitFor(() =>
            this.uiAndLevelStack.some((ui) => ui instanceof CreatureWidget)
        );
        Notifications.clear();
        // Wait for the UI to be dismissed.
        await this.waitFor(() =>
            this.uiAndLevelStack.every((ui) => !(ui instanceof CreatureWidget))
        );

        const playerY = this.level.player.y;
        Notifications.addNotification(
            '"Press jump again in midair to use our secondary ability."',
            // Never hide, because the cutscene will hide it for us.
            this.waitFor(
                () =>
                    this.level.player.isStanding() &&
                    this.level.player.y < playerY
            )
        );
    }
}
