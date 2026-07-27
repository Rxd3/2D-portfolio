import kaboom from "kaboom";

export const k = kaboom({
    global: false,
    touchToMouse: true,
    crisp: true,
    canvas: document.getElementById('game'),
});
