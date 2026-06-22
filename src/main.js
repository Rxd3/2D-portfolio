import { k } from "./kaBoomCtx";
import { scaleFactor } from "./constants";
import { displayDialogue } from "./utils";
import { setCamScale } from "./utils";
import { dialogueData } from "./constants";

const passThroughBoundaryIds = new Set([36]);

k.setBackground(k.Color.fromHex("#1e0022"));
k.loadSprite("map", "./map1.png", );
k.loadSprite("door", "sprites/door.png");
k.loadSprite("point-of-interest", "sprites/pointofIntrest.png", {
    sliceX: 2,
    sliceY: 2,
    anims: {
        pulse: { from: 0, to: 3, speed: 4, loop: true },
    },
});

k.loadSprite("player", "sprites/player (3).png", {
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
k.scene("main",async() => {
    const mapData = await (await fetch("./map.json")).json()
    const layers = mapData.layers;
    const tileChunks = layers
        .filter((layer) => layer.type === "tilelayer" && layer.chunks)
        .flatMap((layer) => layer.chunks);
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
        k.sprite("player", {anim: "idle-down"}),
        k.area({shape: new k.Rect(k.vec2(0, 16), 10, 6)}),
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
            activeDialogue: null,
            closeDialogue: null,
        },
        "player",
    ]);

    for (const layer of layers) {
        if (layer.name === "boundaries") {
            for (const boundary of layer.objects) {
                map.add([
                    k.area({shape: new k.Rect(k.vec2(0), boundary.width, boundary.height)}),
                    ...(!passThroughBoundaryIds.has(boundary.id)
                        ? [k.body({isStatic: true})]
                        : []),
                    k.pos(boundary.x + mapOffset.x, boundary.y + mapOffset.y),
                    boundary.name
                ]);

                const dialogueText = dialogueData[boundary.name];
                if (dialogueText) {
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

                    player.onCollide(boundary.name, () => {
                        if (player.activeDialogue === boundary.name) return;

                        player.closeDialogue?.();
                        player.activeDialogue = boundary.name;
                        player.isInDialogue = true;
                        player.closeDialogue = displayDialogue(dialogueText, () => {
                            if (player.activeDialogue !== boundary.name) return;

                            player.isInDialogue = false;
                            player.activeDialogue = null;
                            player.closeDialogue = null;
                        });
                    });

                    player.onCollideEnd(boundary.name, () => {
                        if (player.activeDialogue === boundary.name) {
                            player.closeDialogue?.();
                        }
                    });
                }
                
            }
            continue;
        }
        if (layer.name === "spawnpoint") {
            for (const entity of layer.objects) {
                if (entity.name === "player") {
                    player.pos = map.pos.add(
                        k.vec2(
                            entity.x + mapOffset.x,
                            entity.y + mapOffset.y,
                        ).scale(scaleFactor),
                    );
                    k.add (player);
                    continue;
                }
            }
        }
    }
    setCamScale(k);
    k.onResize(() => {setCamScale(k)});

    k.onUpdate(() => {
        k.camPos(player.pos.x ,player.pos.y +100);

        const movement = k.vec2(
            Number(k.isKeyDown("d")) - Number(k.isKeyDown("a")),
            Number(k.isKeyDown("s")) - Number(k.isKeyDown("w")),
        );

        if (movement.x === 0 && movement.y === 0) {
            if (player.isKeyboardMoving) {
                player.isKeyboardMoving = false;
                if (player.direction === "down") player.play("idle-down");
                else if (player.direction === "up") player.play("idle-up");
                else player.play("idle-side");
            }
            return;
        }

        player.isKeyboardMoving = true;
        player.move(movement.unit().scale(player.speed));

        if (movement.x !== 0) {
            player.flipX = movement.x < 0;
            if (player.curAnim() !== "walk-side") player.play("walk-side");
            player.direction = movement.x < 0 ? "left" : "right";
        } else if (movement.y < 0) {
            if (player.curAnim() !== "walk-up") player.play("walk-up");
            player.direction = "up";
        } else if (movement.y > 0) {
            if (player.curAnim() !== "walk-down") player.play("walk-down");
            player.direction = "down";
        }
    });
    k.onMouseDown((MouseBtn) => {
        if (MouseBtn !== "left") return;
        const WorldMousePos = k.toWorld(k.mousePos());
        player.moveTo(WorldMousePos, player.speed);

        const mouseAngle = player.pos.angle(WorldMousePos);

        const lowerBound = 50;
        const upperBound = 125;

        if (mouseAngle >= lowerBound && mouseAngle < upperBound && player.curAnim() !== "walk-up") {
            player.play("walk-up");
            player.direction = "up";
            return;
        }
        if (Math.abs(mouseAngle) >= upperBound ) {
            player.flipX=false;
            if (player.curAnim() !== "walk-side") {
                player.play("walk-side");
            }
            player.direction = "right";
            return;
        }
        if (mouseAngle >= -upperBound && mouseAngle < -lowerBound && player.curAnim() !== "walk-down") {
            player.play("walk-down");
            player.direction = "down";
            return;
        }
         if (Math.abs(mouseAngle) < lowerBound ) {
            player.flipX=true;
            if (player.curAnim() !== "walk-side") {
                player.play("walk-side");
            }
            player.direction = "left";
            return;}
      
    });
    k.onMouseRelease(() => {
        if (player.isKeyboardMoving) return;

        if (player.direction === "down"){
            player.play("idle-down");
            return;
        }
        if (player.direction === "up"){
            player.play("idle-up");
            return;
        }
        player.play("idle-side");
    });
});

k.go("main");
