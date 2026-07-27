import { k } from "./kaBoomCtx";
import { dialogueData, scaleFactor } from "./constants";
import { displayDialogue, setCamScale } from "./utils";
import "./styles.css";
import "./portfolio";

const passThroughBoundaryIds = new Set([36]);
const movementKeyAliases = new Map([
    ["w", "up"],
    ["arrowup", "up"],
    ["s", "down"],
    ["arrowdown", "down"],
    ["a", "left"],
    ["arrowleft", "left"],
    ["d", "right"],
    ["arrowright", "right"],
]);
const pressedMovementKeys = new Set();
const pointerInput = {
    isDown: false,
    pointerId: null,
    target: null,
    stuckFrames: 0,
};
const pointerStopDistance = 8;
const pointerStuckFrameLimit = 10;

k.setBackground(k.Color.fromHex("#1e0022"));
k.loadSprite("map", "./map1.png");
k.loadSprite("door", "./sprites/door.png");
k.loadSprite("point-of-interest", "./sprites/pointofIntrest.png", {
    sliceX: 2,
    sliceY: 2,
    anims: {
        pulse: { from: 0, to: 3, speed: 4, loop: true },
    },
});

k.loadSprite("player", "./sprites/player (3).png", {
    sliceX: 6,
    sliceY: 10,
    anims: {
        "idle-down": { from: 0, to: 5, speed: 8, loop: true },
        "idle-side": { from: 6, to: 11, speed: 8, loop: true },
        "idle-up": { from: 12, to: 17, speed: 8, loop: true },
        "walk-down": { from: 18, to: 23, speed: 8, loop: true },
        "walk-side": { from: 24, to: 29, speed: 8, loop: true },
        "walk-up": { from: 30, to: 35, speed: 8, loop: true },
    },
});

function getKeyboardMovement() {
    return k.vec2(
        Number(isMovementDirectionPressed("right")) - Number(isMovementDirectionPressed("left")),
        Number(isMovementDirectionPressed("down")) - Number(isMovementDirectionPressed("up")),
    );
}

function isMovementDirectionPressed(direction) {
    for (const key of pressedMovementKeys) {
        if (movementKeyAliases.get(key) === direction) return true;
    }

    return false;
}

function playIdleAnimation(player) {
    const idleAnimation = player.direction === "down"
        ? "idle-down"
        : player.direction === "up"
            ? "idle-up"
            : "idle-side";

    if (player.curAnim() !== idleAnimation) player.play(idleAnimation);
}

function playMovementAnimation(player, movement) {
    if (Math.abs(movement.x) > Math.abs(movement.y)) {
        player.flipX = movement.x < 0;
        if (player.curAnim() !== "walk-side") player.play("walk-side");
        player.direction = movement.x < 0 ? "left" : "right";
        return;
    }

    if (movement.y < 0) {
        if (player.curAnim() !== "walk-up") player.play("walk-up");
        player.direction = "up";
        return;
    }

    if (movement.y > 0) {
        if (player.curAnim() !== "walk-down") player.play("walk-down");
        player.direction = "down";
    }
}

function clearPointerTarget() {
    pointerInput.isDown = false;
    pointerInput.pointerId = null;
    pointerInput.target = null;
    pointerInput.stuckFrames = 0;
}

function stopPlayer(player) {
    pressedMovementKeys.clear();
    clearPointerTarget();
    player.isKeyboardMoving = false;
    player.isPointerMoving = false;
    playIdleAnimation(player);
}

function markPlayerMoved(player) {
    if (player.hasMoved) return;

    player.hasMoved = true;
    window.dispatchEvent(new CustomEvent("portfolio:first-move"));
}

function isGameOpen() {
    return document.querySelector("[data-game-overlay]")?.classList.contains("is-open") ?? false;
}

document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (!movementKeyAliases.has(key) || event.repeat || !isGameOpen()) return;

    clearPointerTarget();
    pressedMovementKeys.add(key);
});

document.addEventListener("keyup", (event) => {
    pressedMovementKeys.delete(event.key.toLowerCase());
});

k.scene("main", async () => {
    const mapResponse = await fetch("./map.json");
    if (!mapResponse.ok) throw new Error(`Unable to load map data (${mapResponse.status})`);

    const mapData = await mapResponse.json();
    const layers = mapData.layers;
    const tileChunks = layers
        .filter((layer) => layer.type === "tilelayer" && layer.chunks)
        .flatMap((layer) => layer.chunks);

    if (tileChunks.length === 0) throw new Error("The map does not contain any tile chunks.");

    const mapOffset = k.vec2(
        -Math.min(...tileChunks.map((chunk) => chunk.x)) * mapData.tilewidth,
        -Math.min(...tileChunks.map((chunk) => chunk.y)) * mapData.tileheight,
    );

    const map = k.add([
        k.sprite("map"),
        k.pos(0),
        k.scale(scaleFactor),
    ]);

    k.add([
        k.sprite("door"),
        k.pos(0),
        k.scale(scaleFactor),
        k.z(2),
        "door-overlay",
    ]);

    const player = k.make([
        k.sprite("player", { anim: "idle-down" }),
        k.area({ shape: new k.Rect(k.vec2(0, 16), 10, 6) }),
        k.body(),
        k.anchor("center"),
        k.pos(),
        k.scale(scaleFactor),
        k.z(1),
        {
            speed: 250,
            direction: "down",
            isInDialogue: false,
            isKeyboardMoving: false,
            isPointerMoving: false,
            hasMoved: false,
            activeDialogue: null,
            closeDialogue: null,
        },
        "player",
    ]);
    const dialogueLocks = new Set();
    let playerAdded = false;

    for (const layer of layers) {
        if (layer.name === "boundaries") {
            for (const boundary of layer.objects) {
                const boundaryTag = boundary.name || `boundary-${boundary.id}`;

                map.add([
                    k.area({ shape: new k.Rect(k.vec2(0), boundary.width, boundary.height) }),
                    ...(!passThroughBoundaryIds.has(boundary.id)
                        ? [k.body({ isStatic: true })]
                        : []),
                    k.pos(boundary.x + mapOffset.x, boundary.y + mapOffset.y),
                    boundaryTag,
                ]);

                const dialogueText = dialogueData[boundary.name];
                if (!dialogueText) continue;

                k.add([
                    k.sprite("point-of-interest", { anim: "pulse" }),
                    k.pos(
                        (boundary.x + boundary.width / 2 - 3.5 + mapOffset.x) * scaleFactor,
                        (boundary.y - 24 + mapOffset.y) * scaleFactor,
                    ),
                    k.scale(scaleFactor),
                    k.z(3),
                    "point-of-interest",
                ]);

                player.onCollide(boundaryTag, () => {
                    if (dialogueLocks.has(boundaryTag) || player.activeDialogue === boundaryTag) return;

                    player.closeDialogue?.();
                    stopPlayer(player);
                    dialogueLocks.add(boundaryTag);
                    player.activeDialogue = boundaryTag;
                    player.isInDialogue = true;
                    player.closeDialogue = displayDialogue(dialogueText, () => {
                        if (player.activeDialogue !== boundaryTag) return;

                        player.isInDialogue = false;
                        player.activeDialogue = null;
                        player.closeDialogue = null;
                    });
                });

                player.onCollideEnd(boundaryTag, () => {
                    dialogueLocks.delete(boundaryTag);
                    if (player.activeDialogue === boundaryTag) player.closeDialogue?.();
                });
            }
            continue;
        }

        if (layer.name !== "spawnpoint") continue;

        for (const entity of layer.objects) {
            if (entity.name !== "player") continue;

            player.pos = map.pos.add(
                k.vec2(
                    entity.x + mapOffset.x,
                    entity.y + mapOffset.y,
                ).scale(scaleFactor),
            );
            k.add(player);
            playerAdded = true;
            break;
        }
    }

    if (!playerAdded) throw new Error("The map is missing a player spawn point.");

    setCamScale(k);
    k.onResize(() => setCamScale(k));

    const gameCanvas = document.getElementById("game");

    function updatePointerTarget(event) {
        if (!gameCanvas) return;

        const bounds = gameCanvas.getBoundingClientRect();
        const screenPosition = k.vec2(
            (event.clientX - bounds.left) * (k.width() / bounds.width),
            (event.clientY - bounds.top) * (k.height() / bounds.height),
        );

        pointerInput.target = k.toWorld(screenPosition);
        pointerInput.stuckFrames = 0;
    }

    gameCanvas?.addEventListener("pointerdown", (event) => {
        if (event.button !== 0 || !isGameOpen()) return;

        event.preventDefault();
        pressedMovementKeys.clear();
        pointerInput.isDown = true;
        pointerInput.pointerId = event.pointerId;
        updatePointerTarget(event);
        gameCanvas.setPointerCapture?.(event.pointerId);
    });

    gameCanvas?.addEventListener("pointermove", (event) => {
        if (!pointerInput.isDown || event.pointerId !== pointerInput.pointerId) return;
        updatePointerTarget(event);
    });

    window.addEventListener("pointerup", (event) => {
        if (event.pointerId !== pointerInput.pointerId) return;

        pointerInput.isDown = false;
        pointerInput.pointerId = null;
        if (gameCanvas?.hasPointerCapture?.(event.pointerId)) {
            gameCanvas.releasePointerCapture(event.pointerId);
        }
    });

    window.addEventListener("pointercancel", clearPointerTarget);

    k.onUpdate(() => {
        k.camPos(player.pos.x, player.pos.y + 100);

        if (!isGameOpen()) {
            stopPlayer(player);
            return;
        }

        const movement = getKeyboardMovement();

        if (movement.x !== 0 || movement.y !== 0) {
            const dialogueWasOpen = player.isInDialogue;
            pointerInput.target = null;
            pointerInput.stuckFrames = 0;
            player.isKeyboardMoving = true;
            player.isPointerMoving = false;
            player.move(movement.unit().scale(player.speed));

            if (!dialogueWasOpen && player.isInDialogue) {
                stopPlayer(player);
                return;
            }

            playMovementAnimation(player, movement);
            markPlayerMoved(player);
            return;
        }

        player.isKeyboardMoving = false;

        if (!pointerInput.target) {
            if (player.isPointerMoving) {
                player.isPointerMoving = false;
                playIdleAnimation(player);
            }
            return;
        }

        const pointerMovement = pointerInput.target.sub(player.pos);
        if (pointerMovement.len() <= pointerStopDistance) {
            clearPointerTarget();
            player.isPointerMoving = false;
            playIdleAnimation(player);
            return;
        }

        const dialogueWasOpen = player.isInDialogue;
        const previousPosition = player.pos.clone();
        player.isPointerMoving = true;
        player.moveTo(pointerInput.target, player.speed);

        if (!dialogueWasOpen && player.isInDialogue) {
            stopPlayer(player);
            return;
        }

        pointerInput.stuckFrames = previousPosition.dist(player.pos) < 0.25
            ? pointerInput.stuckFrames + 1
            : 0;

        if (pointerInput.stuckFrames >= pointerStuckFrameLimit) {
            clearPointerTarget();
            player.isPointerMoving = false;
            playIdleAnimation(player);
            return;
        }

        playMovementAnimation(player, pointerMovement);
        markPlayerMoved(player);
    });

    window.addEventListener("blur", () => stopPlayer(player));
    window.addEventListener("portfolio:house-close", () => {
        player.closeDialogue?.();
        stopPlayer(player);
    });
});

k.go("main");
