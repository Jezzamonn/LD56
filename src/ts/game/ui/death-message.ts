import { wait } from "../../lib/util";

export namespace DeathMessage {

    let shown = false;

    export async function show() {
        if (shown) {
            return;
        }
        shown = true;

        const container = document.querySelector('.death-message-container')! as HTMLElement;
        const message = document.querySelector('.death-message')! as HTMLElement;

        container.classList.remove('hidden');
        await wait(0.1);
        if (!shown) {
            return;
        }
        message.classList.add('death-message__shown');
    }

    export async function hide() {
        if (!shown) {
            return;
        }

        shown = false;

        const container = document.querySelector('.death-message-container')! as HTMLElement;
        const message = document.querySelector('.death-message')! as HTMLElement;

        container.classList.add('hidden');
        await wait(0.1);
        if (shown) {
            return;
        }
        message.classList.remove('death-message__shown');
    }
}