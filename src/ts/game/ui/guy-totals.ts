import { Guy, GuyType } from "../entity/guy";

const types: GuyType[] = [GuyType.Normal, GuyType.Fire];

export namespace GuyTotals {
    export function updateGuyTotals(availableGuys: Guy[], knownGuys: Guy[]): void {
        const availableTotals = new Map<GuyType, number>();
        const knownTotals = new Map<GuyType, number>();
        for (const type of types) {
            availableTotals.set(type, 0);
            knownTotals.set(type, 0);
        }

        for (const guy of availableGuys) {
            const type = availableTotals.has(guy.type) ? guy.type : GuyType.Normal;
            availableTotals.set(type, availableTotals.get(type)! + 1);
        }
        for (const guy of knownGuys) {
            const type = knownTotals.has(guy.type) ? guy.type : GuyType.Normal;
            knownTotals.set(type, knownTotals.get(type)! + 1);
        }

        for (const type of types) {
            const elem = document.querySelector(`.guy-total-${type}`)! as HTMLElement;
            elem.innerText = `${availableTotals.get(type)!}/${knownTotals.get(type)!}`;
        }
    }
}
