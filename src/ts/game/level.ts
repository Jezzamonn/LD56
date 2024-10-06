import { FacingDir, Point } from '../common';
import { rng, TILE_SIZE_PX } from '../constants';
import { Images } from '../lib/images';
import { Background } from './background';
import { FocusCamera } from './camera';
import { Creature } from './entity/enemies/creature';
import { Entity } from './entity/entity';
import { Guy, GuyType } from './entity/guy';
import { Player } from './entity/player';
import { Torch } from './entity/torch';
import { Game } from './game';
import { LevelInfo } from './levels';
import { BaseTile } from './tile/base-layer';
import { ObjectTile } from './tile/object-layer';
import { Tiles } from './tile/tiles';

// Contains everything in one level, including the tiles and the entities.
export class Level {
    game: Game;
    entities: Entity[] = [];
    entitySet: Set<Entity> = new Set();
    entitiesToAdd: Entity[] = [];
    image: HTMLImageElement | undefined;
    levelInfo: LevelInfo;

    camera: FocusCamera = new FocusCamera();
    background: Background;

    tiles: Tiles = new Tiles(0, 0);

    start: Point = { x: 0, y: 0 };

    won = false;

    player: Player;

    constructor(game: Game, levelInfo: LevelInfo) {
        this.game = game;
        this.levelInfo = levelInfo;
    }

    initFromImage() {
        const image = Images.images[this.levelInfo.name].image!;
        this.image = image;
        this.entities = [];
        this.tiles = new Tiles(image.width, image.height);

        this.background = new Background(this, {
            x: (TILE_SIZE_PX * image.width) / 2,
            y: (TILE_SIZE_PX * image.height) / 2,
        });

        // Draw the image to a canvas to get the pixels.
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0, image.width, image.height);

        // Read the pixels. White is empty, black is wall, and the red square is the starting position.
        const imageData = context.getImageData(0, 0, image.width, image.height);
        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const basePos = this.tiles.getTileCoord(
                    { x, y },
                    { x: 0.5, y: 1 }
                );

                const color = pixelToColorString(imageData, x, y);
                if (color === 'ffffff') {
                    // Don't need to do anything for empty tiles as they're the default.
                } else if (color === '000000') {
                    this.tiles.baseLayer.setTile({ x, y }, BaseTile.Wall, {
                        allowGrow: false,
                    });
                } else if (color === 'aaaaaa') {
                    this.tiles.baseLayer.setTile(
                        { x, y },
                        BaseTile.Background,
                        { allowGrow: false }
                    );
                } else if (color === 'ffff00') {
                    // Spawn the lil guy.
                    const guy = new Guy(this);
                    guy.midX = basePos.x;
                    guy.maxY = basePos.y;
                    guy.type = GuyType.Unique;
                    this.immediatelyAddEntity(guy);
                } else if (color === 'ff00ff') {
                    this.start = basePos;
                    this.tiles.objectLayer.setTile({ x, y }, ObjectTile.Spawn, {
                        allowGrow: false,
                    });
                    this.tiles.baseLayer.setTile({ x, y }, BaseTile.Unknown, {
                        allowGrow: false,
                    });
                } else if (color.slice(0, 5) === 'ff000') {
                    const enemy = new Creature(this);
                    enemy.midX = basePos.x;
                    enemy.maxY = basePos.y;

                    const modifier = parseInt(color[5], 16);

                    enemy.facingDir =
                        modifier % 2 === 0 ? FacingDir.Left : FacingDir.Right;

                    enemy.behavior = modifier >> 1;

                    this.immediatelyAddEntity(enemy);

                    this.tiles.baseLayer.setTile({ x, y }, BaseTile.Unknown, {
                        allowGrow: false,
                    });
                } else if (color === '333333') {
                    this.tiles.objectLayer.setTile(
                        { x, y },
                        ObjectTile.Platform,
                        { allowGrow: false }
                    );
                    this.tiles.baseLayer.setTile({ x, y }, BaseTile.Unknown, {
                        allowGrow: false,
                    });
                } else if (color === '0000ff') {
                    this.tiles.objectLayer.setTile(
                        { x, y },
                        ObjectTile.Destroyable,
                        { allowGrow: false }
                    );
                    this.tiles.baseLayer.setTile({ x, y }, BaseTile.Unknown, {
                        allowGrow: false,
                    });
                } else {
                    console.log(`Unknown color: ${color} at ${x}, ${y}.`);
                }
            }
        }
        this.tiles.baseLayer.fillInUnknownTiles();

        // this.camera.target = () => ({x: this.start.x, y: this.start.y});

        this.spawnPlayer();

        // Spawn some enemies to test things.
        const spawnPositions: Point[] = [];
        for (let x = this.tiles.baseLayer.minX; x <= this.tiles.baseLayer.maxX; x++) {
            for (let y = this.tiles.baseLayer.minY; y <= this.tiles.baseLayer.maxY - 1; y++) {
                const tile = this.tiles.baseLayer.getTile({ x, y });
                const below = this.tiles.baseLayer.getTile({ x, y: y + 1 });
                if (tile === BaseTile.Empty && below === BaseTile.Wall) {
                    spawnPositions.push({ x, y });
                }
            }
        }
        for (let i = 0; i < spawnPositions.length / 20; i++) {
            if (spawnPositions.length === 0) {
                break;
            }
            const index = Math.floor(rng() * spawnPositions.length);
            const pos = spawnPositions.splice(index, 1)[0];
            const basePos = this.tiles.getTileCoord(pos, { x: 0.5, y: 1 });

            const thing = new Torch(this);
            thing.midX = basePos.x;
            thing.maxY = basePos.y;
            this.immediatelyAddEntity(thing);
            console.log(`Spawned torch at ${pos.x}, ${pos.y}.`);
        }
    }

    immediatelyAddEntity(entity: Entity) {
        if (this.entitySet.has(entity)) {
            return;
        }
        this.entities.push(entity);
        this.entitySet.add(entity);
    }

    addEntity(entity: Entity) {
        this.entitiesToAdd.push(entity);
    }

    // Get entity by type
    getEntity<T extends Entity>(type: new (level: Level) => T): T | undefined {
        for (const entity of this.entities) {
            if (entity instanceof type) {
                return entity;
            }
        }
        return undefined;
    }

    // Get all entities by type
    getEntities<T extends Entity>(type: new (level: Level) => T): T[] {
        const result: T[] = [];
        for (const entity of this.entities) {
            if (entity instanceof type) {
                result.push(entity);
            }
        }
        return result;
    }

    spawnPlayer() {
        const player = new Player(this);
        player.midX = this.start.x;
        player.maxY = this.start.y;
        this.immediatelyAddEntity(player);

        this.player = player;

        this.camera.target = () => player.cameraFocus();
    }

    update(dt: number) {
        for (const entity of this.entities) {
            if (!entity.done) {
                entity.update(dt);
            }
        }

        for (const ent of this.entitiesToAdd) {
            this.immediatelyAddEntity(ent);
        }
        this.entitiesToAdd = [];

        for (let i = this.entities.length - 1; i >= 0; i--) {
            if (this.entities[i].done) {
                const ent = this.entities.splice(i, 1)[0];
                this.entitySet.delete(ent);
            }
        }

        this.background.update(dt);
        this.tiles.update(dt);
        this.camera.update(dt);
    }

    render(context: CanvasRenderingContext2D) {
        this.camera.applyTransform(context);

        this.background.render(context);

        this.tiles.objectLayer.render(context);

        for (const entity of this.entities) {
            entity.render(context);
        }

        this.tiles.baseLayer.render(context);
    }

    win() {
        this.won = true;
        this.game.win();
    }
}

function pixelToColorString(imageData: ImageData, x: number, y: number) {
    const i = (y * imageData.width + x) * 4;
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    return (
        r.toString(16).padStart(2, '0') +
        g.toString(16).padStart(2, '0') +
        b.toString(16).padStart(2, '0')
    );
}
