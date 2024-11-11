import { physFromPx } from '../../constants';
import {
    EntityInstance,
    ReferenceToAnEntityInstance,
} from '../../lib/ldtk-json';
import { Level } from '../level';
import { Notifications } from '../ui/notification';
import { Entity } from './entity';

export class Trigger extends Entity {
    triggerName = '';

    stopArea: Entity | undefined;
    message: string | undefined;

    isTriggered = false;

    donePromise: Promise<void>;
    resolveDone: () => void;

    constructor(
        level: Level,
        ldtkEntity: EntityInstance,
        ldtkEntities: EntityInstance[]
    ) {
        super(level);
        this.minX = physFromPx(ldtkEntity.px[0]);
        this.minY = physFromPx(ldtkEntity.px[1]);
        this.w = physFromPx(ldtkEntity.width);
        this.h = physFromPx(ldtkEntity.height);

        this.triggerName = ldtkEntity.fieldInstances.find(
            (f) => f.__identifier === 'TriggerName'
        )!.__value as string;

        this.message = ldtkEntity.fieldInstances.find(
            (f) => f.__identifier === 'Message'
        )?.__value as string | undefined;

        const stopAreaRef = ldtkEntity.fieldInstances.find(
            (f) => f.__identifier === 'StopArea'
        )!.__value as ReferenceToAnEntityInstance | null;

        if (stopAreaRef) {
            const stopArea = ldtkEntities.find(
                (e) => e.iid === stopAreaRef.entityIid
            );
            if (stopArea) {
                this.stopArea = new Entity(level);
                this.stopArea.minX = physFromPx(stopArea.px[0]);
                this.stopArea.minY = physFromPx(stopArea.px[1]);
                this.stopArea.w = physFromPx(stopArea.width);
                this.stopArea.h = physFromPx(stopArea.height);
                // Not added to the level.
            }
        }

        this.donePromise = new Promise((resolve) => {
            this.resolveDone = resolve;
        });
    }

    update(dt: number) {
        // Don't need to do super.
        const inRange = this.isTouchingEntity(this.level.player);
        if (inRange && !this.isTriggered) {
            this.trigger();
        }
        if (!inRange && this.isTriggered) {
            this.untrigger();
        }
        this.isTriggered = inRange;

        if (this.stopArea?.isTouchingEntity(this.level.player)) {
            this.done = true;
            this.resolveDone();
        }
    }

    trigger() {
        switch (this.triggerName) {
            case 'float':
                Notifications.addNotification(
                    "The grey creatures' secondary ability lets you glide over gaps by holding the jump button in the air.",
                    this.donePromise
                );
                break;
            case 'message':
                Notifications.addNotification(
                    (this.message ?? '').replace(/\n/g, '<br>'),
                    this.donePromise
                );
                break;
            case 'camera-focus':
                this.level.camera.pushTarget(() => ({
                    x: this.midX,
                    y: this.midY,
                }));
                break;
            default:
                console.warn(`Unknown trigger name: ${this.triggerName}`);
                break;
        }
    }

    untrigger() {
        switch (this.triggerName) {
            case 'halfway':
                Notifications.clear();
                break;
            case 'camera-focus':
                this.level.camera.popTarget();
                break;
        }
    }

    render(context: CanvasRenderingContext2D) {
        super.render(context);
        this.stopArea?.render(context);
    }
}
