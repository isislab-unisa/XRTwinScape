import { TransformHandler } from "./transform-handler";
import { Events } from "./events";
import { Pivot } from "./pivot";
import { Transform } from "./transform";
import { BoundingBoxElement } from "./boundingBoxElement";

const transform = new Transform();

class BoundingBoxTransformHandler implements TransformHandler {
    events: Events;
    boundingBox: BoundingBoxElement;

    constructor(events: Events) {
        this.events = events;

        events.on('pivot.started', (pivot: Pivot) => {
            if (this.boundingBox) {
                this.start();
            }
        });

        events.on('pivot.moved', (pivot: Pivot) => {
            if (this.boundingBox) {
                this.update(pivot.transform);
            }
        });

        events.on('pivot.ended', (pivot: Pivot) => {
            if (this.boundingBox) {
                this.end();
            }
        });

        events.on('pivot.origin', (mode: 'center' | 'boundCenter') => {
            if (this.boundingBox) {
                this.placePivot();
            }
        });

    }

    placePivot() {
        // place initial pivot point
        const origin = this.events.invoke('pivot.origin');
        this.boundingBox.getPivot(origin === 'center' ? 'center' : 'boundCenter', false, transform);
        this.events.fire('pivot.place', transform);
    }

    activate() {
        this.boundingBox = this.events.invoke('boundingBox') as BoundingBoxElement;
        if (this.boundingBox) {
            this.placePivot();
        }
    }

    deactivate() {
        this.boundingBox = null;
    }

    start() {
    }

    update(transform: Transform) {
        this.boundingBox.move(transform.position, transform.rotation, transform.scale);
        this.events.fire('boundingBox.moved', this.boundingBox);
    }

    end() {
    }
}

export { BoundingBoxTransformHandler }
