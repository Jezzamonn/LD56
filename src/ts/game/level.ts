import ldtk from '../../../level/creatures.json';
import { FacingDir, Point } from '../common';
import { DEBUG, physFromPx, SWITCH_WEAPON_KEYS, TILE_SIZE_PX } from '../constants';
import { Level as LdtkLevel } from '../lib/ldtk-json';
import { Background } from './background';
import { FocusCamera } from './camera';
import { Column } from './entity/column';
import { Decor } from './entity/decor';
import { Creature } from './entity/enemies/creature';
import { Entity } from './entity/entity';
import { Guy, GuyType } from './entity/guy';
import { Player } from './entity/player';
import { Torch } from './entity/torch';
import { Trigger } from './entity/trigger';
import { Waterfall } from './entity/waterfall';
import { Game } from './game';
import { BaseTile } from './tile/base-layer';
import { ObjectTile } from './tile/object-layer';
import { Tiles } from './tile/tiles';
import { CreatureWidget } from './ui/creature-widget';
import { GuyTotals } from './ui/guy-totals';
import { UiStackElement } from './ui/ui-stack-element';

// Contains everything in one level, including the tiles and the entities.
export class Level implements UiStackElement {
    game: Game;
    entities: Entity[] = [];
    entitySet: Set<Entity> = new Set();
    entitiesToAdd: Entity[] = [];

    camera: FocusCamera = new FocusCamera();
    background: Background;

    tiles: Tiles = new Tiles(0, 0);

    playerStart: Point = { x: 0, y: 0 };

    won = false;

    player: Player;

    constructor(game: Game) {
        this.game = game;
    }
    done: boolean;

    fastForwardSpeed = 1;

    init() {
        const level: LdtkLevel = ldtk.levels[0];
        const width = level.pxWid / TILE_SIZE_PX;
        const height = level.pxHei / TILE_SIZE_PX;

        this.background = new Background(this, {
            x: (TILE_SIZE_PX * width) / 2,
            y: (TILE_SIZE_PX * height) / 2,
        });

        const intGrid = level.layerInstances!.find((layer) => layer.__identifier === 'IntGrid')!;
        this.tiles = new Tiles(intGrid.__cWid, intGrid.__cHei);
        for (let y = 0; y < intGrid.__cHei; y++) {
            for (let x = 0; x < intGrid.__cWid; x++) {
                const tile = intGrid.intGridCsv[y * intGrid.__cWid + x];
                if (tile === 1) {
                    this.tiles.baseLayer.setTile({ x, y }, BaseTile.Wall, {
                        allowGrow: false,
                    });
                } else if (tile === 2) {
                    this.tiles.objectLayer.setTile({ x, y }, ObjectTile.Platform, {
                        allowGrow: false,
                    });
                } else if (tile === 3) {
                    this.tiles.objectLayer.setTile({ x, y }, ObjectTile.Destroyable, {
                        allowGrow: false,
                    });
                } else if (tile === 4) {
                    this.tiles.baseLayer.setTile({ x, y }, BaseTile.InvisibleWall, {
                        allowGrow: false,
                    });
                }
            }
        }

        this.entities = [];
        const entityLayer = level.layerInstances!.find((layer) => layer.__identifier === 'Entities')!;
        for (const entity of entityLayer.entityInstances) {
            switch (entity.__identifier) {
                case 'Spawn':
                    this.playerStart = {
                        x: physFromPx(entity.px[0]),
                        y: physFromPx(entity.px[1] - 1),
                    };
                    break;
                case 'Lilguy':
                    const guy = new Guy(this);
                    guy.midX = physFromPx(entity.px[0]);
                    guy.maxY = physFromPx(entity.px[1]);
                    guy.type = GuyType.Normal;
                    guy.isUnique = true;
                    guy.facingDir = FacingDir.Left;
                    guy.followingPlayer = false;
                    this.immediatelyAddEntity(guy);
                    break;
                case 'Torch':
                    const torch = new Torch(this);
                    torch.midX = physFromPx(entity.px[0]);
                    torch.maxY = physFromPx(entity.px[1]);
                    this.immediatelyAddEntity(torch);
                    break;
                case 'InvisibleRespawn':
                    const invisibleTorch = new Torch(this);
                    invisibleTorch.midX = physFromPx(entity.px[0]);
                    invisibleTorch.maxY = physFromPx(entity.px[1]);
                    invisibleTorch.visible = false;
                    this.immediatelyAddEntity(invisibleTorch);
                    break;
                case 'CreatureEnemy':
                    const enemy = new Creature(this);
                    enemy.midX = physFromPx(entity.px[0]);
                    enemy.maxY = physFromPx(entity.px[1]) - 1;
                    enemy.initFromEditor(entity.fieldInstances);
                    this.immediatelyAddEntity(enemy);
                    break;
                case 'Column':
                    const column = new Column(this);
                    column.midX = physFromPx(entity.px[0]);
                    column.maxY = physFromPx(entity.px[1]);
                    this.immediatelyAddEntity(column);
                    break;
                case 'WaterfallStart':
                    const waterfall = new Waterfall(this);
                    waterfall.midX = physFromPx(entity.px[0]);
                    waterfall.midY = physFromPx(entity.px[1]);
                    this.immediatelyAddEntity(waterfall);
                    break;
                case 'TriggerArea':
                    const trigger = new Trigger(this, entity, entityLayer.entityInstances);
                    this.immediatelyAddEntity(trigger);
                    break;
                case 'StopArea':
                    // Handled by thbe trigger.
                    break;
                default:
                    console.warn(`Unknown entity type: ${entity.__identifier}`);
                    break;
            }
        }

        this.spawnPlayer();

        Decor.addDecorToLevel(this);
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
        player.midX = this.playerStart.x;
        player.maxY = this.playerStart.y;
        this.immediatelyAddEntity(player);

        this.player = player;

        this.camera.pushTarget(() => player.cameraFocus());
    }

    savePlayerPosition() {
        const localStoragePrefix = 'ihaveputthecreatureintomygun';
        const key = `${localStoragePrefix}-last-player-position`;
        localStorage.setItem(
            key,
            JSON.stringify({ x: this.player.midX, y: this.player.maxY })
        );
    }

    loadPlayerPosition() {
        const localStoragePrefix = 'ihaveputthecreatureintomygun';
        const key = `${localStoragePrefix}-last-player-position`;
        const json = localStorage.getItem(key);
        if (!json) {
            return;
        }
        const { x, y } = JSON.parse(json);
        this.player.midX = x;
        this.player.maxY = y;
    }

    update(dt: number) {
        // DEBUG: Run the game faster to test it faster.
        if (DEBUG) {
            dt *= this.fastForwardSpeed;
        }

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

        GuyTotals.updateGuyTotals(this.player);

        this.handleInput();

        if (DEBUG) {
            // To make play testing quicker, save the last position of the player.
            this.savePlayerPosition();
        }
    }

    handleInput() {
        const keys = this.game.keys;
        if (this.player.foundTypes.length > 1 && keys.anyWasPressedThisFrame(SWITCH_WEAPON_KEYS)) {
            this.showCreatureWidget();
        }

        if (DEBUG) {
            if (keys.wasPressedThisFrame('Digit4')) {
                this.fastForwardSpeed = 4;
            }
            if (keys.wasPressedThisFrame('Digit3')) {
                this.fastForwardSpeed = 3;
            }
            if (keys.wasPressedThisFrame('Digit2')) {
                this.fastForwardSpeed = 2;
            }
            if (keys.wasPressedThisFrame('Digit1')) {
                this.fastForwardSpeed = 1;
            }
        }
    }

    showCreatureWidget() {
        const creatureWidget = new CreatureWidget(this);
        creatureWidget.show();
        this.game.uiAndLevelStack.push(creatureWidget);
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
}
