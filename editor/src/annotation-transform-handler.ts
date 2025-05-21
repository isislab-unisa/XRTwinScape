import { Events } from "./events";
import { TransformHandler } from "./transform-handler";
import { Transform } from "./transform";
import { Annotation } from "./annotation";
import { Pivot } from "./pivot";

const transform = new Transform();

class AnnotationTransformHandler implements TransformHandler {
    events: Events;    
    annotation: Annotation;

    constructor(events: Events) {
        this.events = events;

        events.on('pivot.started', (pivot: Pivot) => {
            if (this.annotation) {
                this.start();
            }
        });

        events.on('pivot.moved', (pivot: Pivot) => {
            if (this.annotation) {
                this.update(pivot.transform);
            }
        });

        events.on('pivot.ended', (pivot: Pivot) => {
            if (this.annotation) {
                this.end();
            }
        });

        /*
        events.on('pivot.origin', (mode: 'center' | 'boundCenter') => {
            if (this.annotation) {
                this.placePivot();
            }
        });*/
    }

    placePivot() {
        // place initial pivot point
        const origin = this.events.invoke('pivot.origin');
        this.annotation.getPivot(origin === 'center' ? 'center' : 'boundCenter', false, transform);
        this.events.fire('pivot.place', transform);
    }

    activate() {
        // on selection
        this.annotation = this.events.invoke('annotationSelection') as Annotation;
        if (this.annotation) {
            this.placePivot();
        }
    }

    deactivate() {
        this.annotation = null
    }

    start() {
    }

    update(transform: Transform) {
        this.annotation.position.set(transform.position.x, transform.position.y, transform.position.z);
        this.events.fire('annotation.moved', this.annotation);
    }

    end() {
    }
}

export { AnnotationTransformHandler };