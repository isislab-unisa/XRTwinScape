import { Container, Element, Label, NumericInput, TextAreaInput, TextInput } from 'pcui';

import { Events } from '../events';
import { Tooltips } from './tooltips';
import { AnnotationDetail } from './annotation-detail';
import { ActivityDetail } from './activity-detail';

class AnnotationPanel extends Container {

    constructor(events: Events, tooltips: Tooltips, args = {}) {
        args = {
            ...args,
            id: 'annotation-panel',
            class: 'panel'
        };

        super(args);

        // stop pointer events bubbling
        ['pointerdown', 'pointerup', 'pointermove', 'wheel', 'dblclick'].forEach((eventName) => {
            this.dom.addEventListener(eventName, (event: Event) => event.stopPropagation());
        });

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
        
        this.append(annotationDetailHeader);
        const annotationDetail = new AnnotationDetail(events, tooltips);
        this.append(annotationDetail);

        const activityDetailHeader = new Container({
            class: 'panel-header'
        });

        const activityDetailIcon = new Label({
            text: '\uE111',
            class: 'panel-header-icon'
        });

        const activityDetailLabel = new Label({
            text: 'ACTIVITY OBJECTIVE',
            class: 'panel-header-label'
        });

        activityDetailHeader.append(activityDetailIcon);
        activityDetailHeader.append(activityDetailLabel);

        this.append(activityDetailHeader);
        const activityDetail = new ActivityDetail(events, tooltips);
        this.append(activityDetail);
        
        const bottomHeader = new Element({
            class: 'panel-header',
            height: 20
        });
        this.append(bottomHeader);

        const setVisible = (visible: boolean) => {
            this.hidden = !visible;
        };

        events.on('annotationList.selectionChanged', (annotation: any) => {
            setVisible(!!annotation);
        });

        events.on('selection.playerCameraChanged', (playerCamera: any) => {
            if (playerCamera) setVisible(false);
        });

        events.on('selection.boundingBoxChanged', (boundingBox: any) => {
            if (boundingBox) setVisible(false);
        });
        
        setVisible(!!events.invoke('annotationSelection'));
    }
}

export { AnnotationPanel };
