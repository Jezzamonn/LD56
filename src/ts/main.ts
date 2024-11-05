import { Game } from "./game/game";

async function init() {
    await Game.preload();

    const game = new Game('.canvas');
    game.start();

    const clickToStartElem = document.querySelector('.click-to-start');
    clickToStartElem?.addEventListener('click', () => {
        game.startPlaying();
        clickToStartElem?.remove();
    });

    // // For working on the menu, hide the click to start button.
    // clickToStartElem?.classList.add('hidden');
    // game.update(0);
    // game.render();
    // (game.uiAndLevelStack[0] as Level).showCreatureWidget();
}

window.addEventListener('load', init);