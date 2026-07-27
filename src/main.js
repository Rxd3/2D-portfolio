import "./styles.css";
import "./portfolio";

const gameApp = document.getElementById("game-app");
const gameNote = document.querySelector("[data-game-note]");
let gameLoadPromise = null;

function setGameStatus(message, isBusy, isError = false) {
  if (gameNote) {
    gameNote.textContent = message;
    gameNote.classList.remove("is-dismissed", "is-error");
    gameNote.classList.toggle("is-error", isError);
  }

  gameApp?.setAttribute("aria-busy", String(isBusy));
}

function loadGame() {
  if (gameLoadPromise) return gameLoadPromise;

  setGameStatus("Loading the portfolio house...", true);
  gameLoadPromise = import("./game.js").catch(() => {
    setGameStatus("The portfolio house could not load. Please refresh and try again.", false, true);
  });

  return gameLoadPromise;
}

window.addEventListener("portfolio:house-open", loadGame);
window.addEventListener("portfolio:house-ready", () => {
  setGameStatus("Move with WASD, arrow keys, or click/tap. Find the glowing markers.", false);
});
