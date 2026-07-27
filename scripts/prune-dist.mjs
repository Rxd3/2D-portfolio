import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const distDirectory = fileURLToPath(new URL("../dist/", import.meta.url));

// Keep source artwork in the repository without shipping unused copies.
const unusedBuildAssets = [
  "map.png",
  "rasit-pixel-portrait2.png",
  "sprites/Alchemy_Table_02-Sheet.png",
  "sprites/Esoteric.png",
  "sprites/Floors_Tiles.png",
  "sprites/Furniture.png",
  "sprites/Interior_Props_01.png",
  "sprites/Interior_Walls_01.png",
  "sprites/Meat.png",
  "sprites/Pan.png",
  "sprites/Props.png",
  "sprites/Roofs.png",
  "sprites/Shadows.png",
  "sprites/Walls.png",
  "sprites/Workbench.png",
  "sprites/player.png",
  "sprites/testchat.png",
];

await Promise.all(
  unusedBuildAssets.map((asset) => rm(join(distDirectory, asset), { force: true })),
);
