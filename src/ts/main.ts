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
}

window.addEventListener('load', init);