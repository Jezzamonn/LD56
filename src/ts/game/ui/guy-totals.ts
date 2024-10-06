import { Guy } from "../entity/guy";

const guyTotalsElem = document.querySelector('.guy-totals')!;

export namespace GuyTotals {
    export function updateGuyTotals(availableGuys: Guy[], knownGuys: Guy[]): void {
        guyTotalsElem.innerHTML = `${availableGuys.length}/${knownGuys.length}`;
    }
}
