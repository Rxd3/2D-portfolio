import { k } from "./kaBoomCtx";
k.setBackground(k.color.fromHex("#5b0088"));
k.loadSprite("map", "map.png", );

k.loadSprite("furniture", "sprites/furniture.png", {
    sliceX: 32,
    sliceY: 32
});
k.loadSprite("player", "sprites/player_chatgpt.png", {
    sliceX: 30,
    sliceY: 18,
    anims: {
        "idle-down": {from: 19, to: 52, speed: 8, loop: true},
        "walk-down": {from: 181, to: 214, speed: 8, loop: true},
        "idle-up": {from: 127, to: 160, speed: 8, loop: true},
        "walk-up": {from: 289, to: 322, speed: 8, loop: true},
        "idle-side": {from: 73, to: 106, speed: 8, loop: true},
        "walk-side": {from: 235, to: 268, speed: 8, loop: true},


    },
});



k.go(main);