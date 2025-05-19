import { Container, Label, Element as PcuiElement } from "pcui";
import { Events } from "../events";
import { Annotation } from "../annotation";
import { Splat } from "../splat";

// TODO add select and delete

class AnnotationItem extends Container
{
    getName: () => string;
    getSelected: () => boolean;
    setSelected: (value: boolean) => void;

    constructor(id: number, args = {}) {
        args = {
            ...args,
            class: ['splat-item', 'visible']
        };

        super(args);

        const text = new Label({
            class: 'splat-item-text',
            text: id.toString()
        });

        this.append(text);

        this.getName = () => {
            return text.value;
        };

        this.getSelected = () => {
            return this.class.contains('selected');
        };

        this.setSelected = (value: boolean) => {
            if (value !== this.selected) {
                if (value) {
                    this.class.add('selected');
                    this.emit('select', this);
                } else {
                    this.class.remove('selected');
                    this.emit('unselect', this);
                }
            }
        };
    }

    get name() {
        return this.getName();
    }

    set selected(value) {
        this.setSelected(value);
    }

    get selected() {
        return this.getSelected();
    }
}

class AnnotationList extends Container{
    constructor(events: Events, args = {}) {
        args = {
            ...args,
            class: 'splat-list'
        };

        super(args);
        
        const items = new Map<Annotation, AnnotationItem>();

        events.on('annotationList.added', (annotation: Annotation) => {
            const item = new AnnotationItem(annotation.id);
            this.append(item);
            items.set(annotation, item);

            // TODO
        });

        events.on('annotationList.removed', (annotation: Annotation) => {
            const item = items.get(annotation);
            if (item) {
                this.remove(item);
                items.delete(annotation);
            }
            // TODO
        });

        events.on('annotationList.selectionChanged', (annotation: Annotation) => {
            items.forEach((value, key) => {
                value.selected = key === annotation;
            });
            // TODO
        });

        events.on('selection.changed', (splat: Splat) => {
            for (const [key, value] of items) {
                events.fire('annotationList.removed', key);
            }
            if(!splat.annotations)
                return;
            for (const annotation of splat.annotations.annotations)
            {
                events.fire('annotationList.added', annotation);
            }
        });

        this.on('click', (item: AnnotationItem) => {
            for (const [key, value] of items) {
                if (item === value) {
                    events.fire('annotationSelection', key);
                    break;
                }
            }
            // TODO
        });

    }

    protected _onAppendChild(element: PcuiElement): void {
        super._onAppendChild(element);

        if (element instanceof AnnotationItem) {
            element.on('click', () => {
                this.emit('click', element);
            });

        }
    }

    protected _onRemoveChild(element: PcuiElement): void {
        if (element instanceof AnnotationItem) {
            element.unbind('click');
        }

        super._onRemoveChild(element);
    }
    
}

export { AnnotationList, AnnotationItem };