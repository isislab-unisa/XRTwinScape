import { Mat4 } from "playcanvas";
import { Events } from "./events";
import { Splat } from "./splat";
import { TransformHandler } from "./transform-handler";
import { Transform } from "./transform";

// TODO implement

class AnnotationTransformHandler implements TransformHandler {
    events: Events;
    splat: Splat;
    bindMat = new Mat4();

    constructor(events: Events) {
        this.events = events;
    }

    activate() {

    }

    deactivate() {
        
    }

    start() {

    }

    update(transform: Transform) {

    }

    end() {
        
    }
}

export { AnnotationTransformHandler };