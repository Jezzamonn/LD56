import { GuyType } from "../entity/guy";
import { Player } from "../entity/player";

const types: GuyType[] = [GuyType.Normal, GuyType.Fire];

let lastValues: Map<GuyType, string> = new Map();

export namespace GuyTotals {
    export function updateGuyTotals(player: Player): void {
        const availableTotals = new Map<GuyType, number>();
        const knownTotals = new Map<GuyType, number>();
        for (const type of types) {
            availableTotals.set(type, 0);
            knownTotals.set(type, 0);
        }

        for (const guy of player.availableGuys) {
            const type = availableTotals.has(guy.type) ? guy.type : GuyType.Normal;
            availableTotals.set(type, availableTotals.get(type)! + 1);
        }
        for (const guy of player.knownGuys) {
            const type = knownTotals.has(guy.type) ? guy.type : GuyType.Normal;
            knownTotals.set(type, knownTotals.get(type)! + 1);
        }

        for (const type of types) {
            const newValue = `${availableTotals.get(type)!}/${knownTotals.get(type)!}`;
            const elem = document.querySelector(`.guy-total-${type}`)! as HTMLElement;
            if (newValue !== lastValues.get(type)) {
                elem.classList.toggle('hidden', knownTotals.get(type)! === 0);

                const textElem = elem.querySelector(`.guy-total-text`)! as HTMLElement;
                textElem.innerText = newValue;

                lastValues.set(type, newValue);
            }
            const arrowElem = elem.querySelector(`.guy-total-arrow`)! as HTMLElement;
            arrowElem.style.visibility = player.selectedGuyType === type ? 'visible' : 'hidden';
        }
    }
}
