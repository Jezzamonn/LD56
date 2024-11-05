import { DOWN_KEYS, JUMP_KEYS, SELECT_KEYS, SHOOT_KEYS, SWITCH_WEAPON_KEYS, UP_KEYS } from '../../constants';
import { Aseprite } from '../../lib/aseprite';
import { GuyType } from "../entity/guy";
import { Level } from '../level';
import { UiStackElement } from '../updatable/ui-stack-element';

const DISMISS_KEYS = SWITCH_WEAPON_KEYS.concat(SELECT_KEYS, JUMP_KEYS, SHOOT_KEYS);

export class CreatureWidget implements UiStackElement {

    static hasInitialised = false;

    done = false;

    readonly container = document.querySelector('.select-creature-container')! as HTMLElement;
    // Add create images to each selection
    readonly options = this.container.querySelectorAll('.select-creature-widget-option') as NodeListOf<HTMLElement>;

    constructor(private level: Level) {}

    init() {
        if (CreatureWidget.hasInitialised) {
            return;
        }
        CreatureWidget.hasInitialised = true;

        for (const option of this.options) {
            const canvas = option.querySelector('canvas')!;
            const context = canvas.getContext('2d')!;
            // Clear canvas.
            context.clearRect(0, 0, canvas.width, canvas.height);

            Aseprite.disableSmoothing(context);

            const type = option.dataset.type! as GuyType;

            const offset = type === GuyType.Normal ? 1 : 0;

            Aseprite.drawSprite({
                context,
                image: 'lilguy',
                frame: 0,
                position: { x: canvas.width / 2, y: canvas.height - offset },
                anchorRatios: { x: 0.5, y: 1 },
                layers: GuyType.sets[type],
            });
        }
    }

    show() {
        this.init();
        this.container.classList.remove('hidden');

        this.updateSelection();
    }

    hide() {
        this.container.classList.add('hidden');
        this.done = true;
    }

    updateSelection() {
        const guyType = this.level.player.selectedGuyType;
        for (const option of this.options) {
            option.classList.toggle('select-creature-widget-option__selected',
                option.dataset.type === guyType);
        }
    }

    update(dt: number): void {
        const keys = this.level.game.keys;

        if (keys.anyWasPressedThisFrame(DISMISS_KEYS)) {
            this.hide();
            return;
        }

        let selection: GuyType | undefined;
        if (keys.anyWasPressedThisFrame(UP_KEYS)) {
            selection = GuyType.Normal;
        }
        else if (keys.anyWasPressedThisFrame(DOWN_KEYS)) {
            selection = GuyType.Fire;
        }

        if (!selection) {
            return;
        }

        this.level.player.selectedGuyType = selection;
        this.updateSelection();
    }
}