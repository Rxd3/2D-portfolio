import { k } from "./kaBoomCtx";
import { scaleFactor } from "./constants";
import { displayDialogue } from "./utils";
import { setCamScale } from "./utils";
k.setBackground(k.Color.fromHex("#1e0022"));
k.loadSprite("map", "./map.png", );

k.loadSprite("player", "sprites/player.png", {
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
    const player = k.make([
        k.sprite("player", {anim: "idle-down"}),
        k.area({shape: new k.Rect(k.vec2(0, 15), 10, 5)}),
        k.body(),
        k.anchor("center"),
        k.pos(),
        k.scale(scaleFactor),
        {
            speed: 250,
            direction: "down",
            isInDialogue: false,
        },
        "player",
    ]);

    for (const layer of layers) {
        if (layer.name === "boundaries") {
            for (const boundary of layer.objects) {
                map.add([
                    k.area({shape: new k.Rect(k.vec2(0), boundary.width, boundary.height)}),
                    k.body({isStatic: true}),
                    k.pos(boundary.x + mapOffset.x, boundary.y + mapOffset.y),
                    boundary.name
                ]);
                if (boundary.name ) {
                    player.onCollide(boundary.name, () => {
                        player.isInDialogue = true;
                        displayDialogue("TODO", () => {player.isInDialogue = false;});
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
        k.camPos(player.pos.x ,player.pos.y +100);});
    k.onMouseDown((MouseBtn) => {
        if (MouseBtn !== "left"||player.isInDialogue) return;
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
