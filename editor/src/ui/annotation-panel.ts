import { Container, Element, Label, NumericInput, TextAreaInput, TextInput } from 'pcui';

import { Events } from '../events';
import { Tooltips } from './tooltips';
import { AnnotationDetail } from './annotation-detail';

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
        this.append(new AnnotationDetail(events, tooltips));
        this.append(new Element({
            class: 'panel-header',
            height: 20
        }));
    }
}

export { AnnotationPanel };
