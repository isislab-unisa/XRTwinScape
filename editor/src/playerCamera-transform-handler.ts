import { TransformHandler } from "./transform-handler";
import { Events } from "./events";
import { Pivot } from "./pivot";
import { Mat4, Quat } from "playcanvas";
import { Transform } from "./transform";
import { PlayerCameraElement } from "./playerCameraElement";

const mat = new Mat4();
const quat = new Quat();
const transform = new Transform();

class PlayerCameraTransformHandler implements TransformHandler {
    events: Events;
    playerCamera: PlayerCameraElement;

    constructor(events: Events) {
        this.events = events;

        events.on('pivot.started', (pivot: Pivot) => {
            if (this.playerCamera) {
                this.start();
            }
        });

        events.on('pivot.moved', (pivot: Pivot) => {
            if (this.playerCamera) {
                this.update(pivot.transform);
            }
        });

        events.on('pivot.ended', (pivot: Pivot) => {
            if (this.playerCamera) {
                this.end();
            }
        });

        events.on('pivot.origin', (mode: 'center' | 'boundCenter') => {
            if (this.playerCamera) {
                this.placePivot();
            }
        });

    }

    placePivot() {
        // place initial pivot point
        const origin = this.events.invoke('pivot.origin');
        this.playerCamera.getPivot(origin === 'center' ? 'center' : 'boundCenter', false, transform);
        this.events.fire('pivot.place', transform);
    }

    activate() {
        console.log('PlayerCameraTransformHandler activated');
        this.playerCamera = this.events.invoke('playerCamera') as PlayerCameraElement;
        if (this.playerCamera) {
            this.placePivot();
        }
    }

    deactivate() {
        this.playerCamera = null;
    }

    start() {
    }

    update(transform: Transform) {
        mat.setTRS(transform.position, transform.rotation, transform.scale);
        quat.setFromMat4(mat);

        const t = mat.getTranslation();
        const r = quat;
        const s = mat.getScale();

        this.playerCamera.move(t, r, s);
    }

    end() {
    }
}

export { PlayerCameraTransformHandler }
