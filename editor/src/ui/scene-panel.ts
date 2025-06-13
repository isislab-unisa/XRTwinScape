import { Container, Element, Label, NumericInput, TextAreaInput, TextInput } from 'pcui';

import { Events } from '../events';
import { localize } from './localization';
import { SplatList } from './splat-list';
import sceneImportSvg from './svg/import.svg';
import sceneNewSvg from './svg/new.svg';
import { Tooltips } from './tooltips';
import { Transform } from './transform';
import { AnnotationList } from './annotation-list';
import { AnnotationDetail } from './annotation-detail';
import { Splat } from 'src/splat';
import { Annotation, AnnotationContent, ContentType } from 'src/annotation';
import { Vec3 } from 'playcanvas';

const createSvg = (svgString: string) => {
    const decodedStr = decodeURIComponent(svgString.substring('data:image/svg+xml,'.length));
    return new DOMParser().parseFromString(decodedStr, 'image/svg+xml').documentElement;
};

class ScenePanel extends Container {

    constructor(events: Events, tooltips: Tooltips, args = {}) {
        args = {
            ...args,
            id: 'scene-panel',
            class: 'panel'
        };

        super(args);

        // stop pointer events bubbling
        ['pointerdown', 'pointerup', 'pointermove', 'wheel', 'dblclick'].forEach((eventName) => {
            this.dom.addEventListener(eventName, (event: Event) => event.stopPropagation());
        });

        const sceneHeader = new Container({
            class: 'panel-header'
        });

        const sceneIcon = new Label({
            text: '\uE344',
            class: 'panel-header-icon'
        });

        const sceneLabel = new Label({
            text: localize('scene-manager'),
            class: 'panel-header-label'
        });

        const sceneImport = new Container({
            class: 'panel-header-button'
        });
        sceneImport.dom.appendChild(createSvg(sceneImportSvg));

        const sceneNew = new Container({
            class: 'panel-header-button'
        });
        sceneNew.dom.appendChild(createSvg(sceneNewSvg));

        const sceneAnnotationImport = new Container({
            class: 'panel-header-button'
        });
        sceneAnnotationImport.dom.appendChild(createSvg(sceneImportSvg));

        sceneHeader.append(sceneIcon);
        sceneHeader.append(sceneLabel);
        sceneHeader.append(sceneImport);
        sceneHeader.append(sceneNew);
        sceneHeader.append(sceneAnnotationImport);

        sceneImport.on('click', async () => {
            await events.invoke('scene.import');
        });
        
        sceneNew.on('click', () => {
            events.invoke('doc.new');
        });

        sceneAnnotationImport.on('click', async () => {
            await events.invoke('scene.annotationImport');
        });

        tooltips.register(sceneImport, 'Import Scene', 'top');        
        tooltips.register(sceneNew, 'New Scene', 'top');
        tooltips.register(sceneAnnotationImport, 'Import Annotations', 'top');

        const splatList = new SplatList(events);

        const splatListContainer = new Container({
            class: 'splat-list-container'
        });
        splatListContainer.append(splatList);

        const transformHeader = new Container({
            class: 'panel-header'
        });

        const transformIcon = new Label({
            text: '\uE111',
            class: 'panel-header-icon'
        });

        const transformLabel = new Label({
            text: localize('transform'),
            class: 'panel-header-label'
        });

        transformHeader.append(transformIcon);
        transformHeader.append(transformLabel);

        const annotationHeader = new Container({
            class: 'panel-header'
        });

        const annotationIcon = new Label({
            text: '\uE111',
            class: 'panel-header-icon'
        });

        const annotationLabel = new Label({
            text: 'ANNOTATIONS',
            class: 'panel-header-label'
        });

        const sceneAnnotationExport = new Container({
            class: 'panel-header-button'
        });
        sceneAnnotationExport.dom.appendChild(createSvg(sceneImportSvg));

        sceneAnnotationExport.on('click', async () => {
            await events.invoke('scene.annotationExport');
        });

        tooltips.register(sceneAnnotationExport, 'Export Annotations', 'top');

        // Add button for adding annotations
        const sceneAnnotationAdd = new Container({
            class: 'panel-header-button'
        });
        sceneAnnotationAdd.dom.appendChild(createSvg(sceneNewSvg)); // Replace `sceneAddSvg` with the appropriate SVG for the add button

        sceneAnnotationAdd.on('click', () => {
            // Get the selected splat
            const selectedSplat = events.invoke('selection') as Splat;

            if (!selectedSplat) {
                console.warn('No splat selected. Please select a splat to add an annotation.');
                return;
            }

            // Find the first available ID starting from 1
            const existingIds = selectedSplat.annotations?.annotations.map(annotation => annotation.id) || [];
            let newId = 1;
            while (existingIds.includes(newId)) {
                newId++;
            }

            // Create a new annotation with activity 1 and the calculated ID
            const newAnnotation = new Annotation(newId);
            newAnnotation.activity = 1;
            newAnnotation.position = Vec3.ZERO.clone();

            // Add the annotation to the selected splat
            selectedSplat.annotations.annotations.push(newAnnotation);
            // Add a default variant with empty text
            const newContent = new AnnotationContent();
            newContent.content = '';
            newContent.contentType = ContentType.Text;
            newAnnotation.defaultContent = newContent

            // Fire the event to update the annotation list
            events.fire('annotationList.added', newAnnotation);
        });

        tooltips.register(sceneAnnotationAdd, 'Add Annotation', 'top');

        annotationHeader.append(annotationIcon);
        annotationHeader.append(annotationLabel);
        annotationHeader.append(sceneAnnotationExport);
        annotationHeader.append(sceneAnnotationAdd); // Append the add button after the export button

        const annotationList = new AnnotationList(events);

        const annotationListContainer = new Container({
            class: 'splat-list-container'
        });
        annotationListContainer.append(annotationList);  

        const annotationDetailHeader = new Container({
            class: 'panel-header'
        });

        const annotationDetailIcon = new Label({
            text: '\uE111',
            class: 'panel-header-icon'
        });

        const annotationDetailLabel = new Label({
            text: 'ANNOTATION DETAIL',
            class: 'panel-header-label'
        });

        annotationDetailHeader.append(annotationDetailIcon);
        annotationDetailHeader.append(annotationDetailLabel);
        
        this.append(sceneHeader);
        this.append(splatListContainer);
        this.append(transformHeader);
        this.append(new Transform(events));
        this.append(annotationHeader);
        this.append(annotationListContainer);
        this.append(annotationDetailHeader);
        this.append(new AnnotationDetail(events, tooltips));
        this.append(new Element({
            class: 'panel-header',
            height: 20
        }));
    }
}

export { ScenePanel };
