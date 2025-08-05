import { Annotation } from './annotation';
import { AnnotationTransformHandler } from './annotation-transform-handler';
import { PlayerCameraTransformHandler } from './playerCamera-transform-handler';
import { EntityTransformHandler } from './entity-transform-handler';
import { Events } from './events';
import { registerPivotEvents } from './pivot';
import { Splat } from './splat';
import { SplatsTransformHandler } from './splats-transform-handler';
import { PlayerCameraElement } from './playerCameraElement';

interface TransformHandler {
    activate: () => void;
    deactivate: () => void;
}

const registerTransformHandlerEvents = (events: Events) => {
    let transformHandler: TransformHandler = null;

    const setTransformHandler = (handler: TransformHandler) => {
        if (transformHandler) {
            transformHandler.deactivate();
        }
        transformHandler = handler;
        if (transformHandler) {
            transformHandler.activate();
        }
    };

    // bind transform target when selection changes
    const entityTransformHandler = new EntityTransformHandler(events);
    const splatsTransformHandler = new SplatsTransformHandler(events);
    const annotationTransformHandler = new AnnotationTransformHandler(events);
    const playerCameraTransformHandler = new PlayerCameraTransformHandler(events);

    const update = (splat: Splat) => {
        if (!splat) {
            setTransformHandler(null);
        } else {
            if (splat.numSelected > 0) {
                setTransformHandler(splatsTransformHandler);
            } else {
                setTransformHandler(entityTransformHandler);
            }
        }
    };

    const updateAnnotation = (annotation: Annotation) => {
        if(!annotation)
        {
            setTransformHandler(null);
        }
        else
        {
            setTransformHandler(annotationTransformHandler);
        }        
    }

    const updatePlayerCamera = (camera: PlayerCameraElement) => {
        console.log('PlayerCameraTransformHandler enabled: ' + camera);
        if(camera !== null)
        {
            setTransformHandler(playerCameraTransformHandler);
        }
        else
        {
            setTransformHandler(null);
        }   
    };

    events.on('selection.splatChanged', update);
    events.on('splat.stateChanged', update);
    events.on('annotationList.selectionChanged', updateAnnotation);
    events.on('selection.playerCameraChanged', updatePlayerCamera);


    registerPivotEvents(events);
};

export { registerTransformHandlerEvents, TransformHandler };
