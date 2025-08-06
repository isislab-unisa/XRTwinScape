import { Annotation } from './annotation';
import { BoundingBoxElement } from './boundingBoxElement';
import { Element, ElementType } from './element';
import { Events } from './events';
import { PlayerCameraElement } from './playerCameraElement';
import { Scene } from './scene';
import { Splat } from './splat';

const registerSelectionEvents = (events: Events, scene: Scene) => {
    let selection: Splat = null;
    let annotationSelected: Annotation = null;
    let playerCameraSelected: PlayerCameraElement = null;
    let boundingBoxSelected: BoundingBoxElement = null;

    const setSelection = (splat: Splat) => {
        const prev = selection;
        selection = splat;
        events.fire('selection.splatChanged', selection, prev);
    };

    events.on('selection', (splat: Splat) => {
        setSelection(splat);
    });

    events.function('selection', () => {
        return selection;
    });

    const setAnnotationSelection = (annotation: Annotation) => {
        if (annotation !== annotationSelected) {
            const prev = annotationSelected;
            annotationSelected = annotation;
            events.fire('annotationList.selectionChanged', annotationSelected, prev);
            if(!annotation) {
				// on deselecting the annotation, select the splat
                const splats = scene.getElementsByType(ElementType.splat) as Splat[];
                if (splats.length >= 1) {
                    setSelection(splats[0]);
                }
            }
        }
    };

    events.on('annotationSelection', (annotation: Annotation) => {
        setAnnotationSelection(annotation);
    });

    events.function('annotationSelection', () => {
        return annotationSelected;
    });

    const setPlayerCameraSelection = (playerCamera: PlayerCameraElement) => {
        playerCameraSelected = playerCamera;
        events.fire('selection.playerCameraChanged', playerCamera);
        if(!playerCamera) {
			// on deselecting the annotation, select the splat
            const splats = scene.getElementsByType(ElementType.splat) as Splat[];
            if (splats.length >= 1) {
                setSelection(splats[0]);
            }
        }
    };

    events.on('playerCamera', (playerCamera: PlayerCameraElement) => {
        setPlayerCameraSelection(playerCamera);
    });

    events.function('playerCamera', () => {
        return playerCameraSelected;
    });

    const setBoundingBoxSelection = (boundingBox: BoundingBoxElement) => {
        boundingBoxSelected = boundingBox;
        events.fire('selection.boundingBoxChanged', boundingBox);
        if(!boundingBox) {
			// on deselecting the annotation, select the splat
            const splats = scene.getElementsByType(ElementType.splat) as Splat[];
            if (splats.length >= 1) {
                setSelection(splats[0]);
            }
        }
    };

    events.on('boundingBox', (boundingBox: BoundingBoxElement) => {
        setBoundingBoxSelection(boundingBox);
    });

    events.function('boundingBox', () => {
        return boundingBoxSelected;
    });

    events.on('selection.next', () => {
        const splats = scene.getElementsByType(ElementType.splat) as Splat[];
        if (splats.length > 1) {
            const idx = splats.indexOf(selection);
            setSelection(splats[(idx + 1) % splats.length]);
        }
    });

    events.on('scene.elementAdded', (element: Element) => {
        if (element.type === ElementType.splat) {
            setSelection(element as Splat);
        }
    });

    events.on('scene.elementRemoved', (element: Element) => {
        if (element === selection) {
            const splats = scene.getElementsByType(ElementType.splat) as Splat[];
            setSelection(splats.length === 1 ? null : splats.find(v => v !== element));
        }
    });

    events.on('splat.visibility', (splat: Splat) => {
        if (splat === selection && !splat.visible) {
            setSelection(null);
        }
    });

    events.on('camera.focalPointPicked', (details: { splat: Splat }) => {
        setSelection(details.splat);
    });
};

export { registerSelectionEvents };
