import { Container, Label, Element as PcuiElement } from "pcui";
import { Events } from "../events";
import { Annotation } from "../annotation";
import { Splat } from "../splat";
import { createSvg } from "./splat-list";
import deleteSvg from './svg/delete.svg';

class AnnotationItem extends Container
{
    private activityLabel: Label;
    getName: () => string;
    getSelected: () => boolean;
    setSelected: (value: boolean) => void;
    destroy: () => void;

    constructor(id: number, activity: number, args = {}) {
        args = {
            ...args,
            class: ['splat-item', 'visible']
        };

        super(args);

        const text = new Label({
            class: 'splat-item-text',
            text: id.toString()
        });

        // Create a container for the activity label
        const activityContainer = new Container({
            class: 'annotationitem-activity-container'
        });

        // Add the "activity:" label
        const activityPrefix = new Label({
            class: 'annotationitem-activity-prefix',
            text: 'activity:'
        });

        // Add the activity number label
        this.activityLabel = new Label({
            class: 'annotationitem-activity',
            text: activity.toString()
        });

        // Append the prefix and activity number to the container
        activityContainer.append(activityPrefix);
        activityContainer.append(this.activityLabel);

        const deleteButton = new PcuiElement({
            dom: createSvg(deleteSvg),
            class: 'splat-item-delete'
        });

        this.append(text);
        this.append(activityContainer); // Append the activity container
        this.append(deleteButton);

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

        const handleRemove = (event: MouseEvent) => {
            event.stopPropagation();
            this.emit('removeClicked', this);
        };

        deleteButton.dom.addEventListener('click', handleRemove);

        this.destroy = () => {
            deleteButton.dom.removeEventListener('click', handleRemove);
        };
    }

    updateActivity(activity: number) {
        this.activityLabel.text = activity.toString();
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

class AnnotationList extends Container 
{
    constructor(events: Events, args = {}) {
        args = {
            ...args,
            class: 'splat-list'
        };

        super(args);

        const items = new Map<Annotation, AnnotationItem>();

        events.on('annotationList.added', (annotation: Annotation) => {
            const item = new AnnotationItem(annotation.id, annotation.activity);
            this.append(item);
            items.set(annotation, item);

            // Handle delete event for the item
            item.on('removeClicked', async () => {
                const result = await events.invoke('showPopup', {
                    type: 'yesno',
                    header: 'Remove Annotation',
                    message: `Are you sure you want to remove annotation with ID '${annotation.id}'? This operation cannot be undone.`
                });

                if (result?.action === 'yes') {
                    const selectedSplat = events.invoke('selection') as Splat;

                    if (!selectedSplat) {
                        console.warn('No splat selected. Please select a splat to add an annotation.');
                        return;
                    }
                    // Remove the annotation from the splat
                    const index = selectedSplat.annotations.annotations.indexOf(annotation);
                    if (index !== -1) {
                        selectedSplat.annotations.annotations.splice(index, 1);
                    }

                    events.fire('annotationList.removed', annotation);
                }
            });
        });

        events.on('annotationList.removed', (annotation: Annotation) => {
            const item = items.get(annotation);
            if (item) {
                this.remove(item);
                items.delete(annotation);
            }
        });

        events.on('annotationList.selectionChanged', (annotation: Annotation) => {
            items.forEach((value, key) => {
                value.selected = key === annotation;
            });
        });

        events.on('selection.changed', (splat: Splat) => {
            events.fire('annotationSelection', null);
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

        events.on('annotationDetail.activityChanged', (annotation: Annotation) => {
            const item = items.get(annotation);
            if (item) {
                item.updateActivity(annotation.activity);
            }
        });


        this.on('click', (item: AnnotationItem) => {
            for (const [key, value] of items) {
                if (item === value) {
                    if (value.selected) {
                    events.fire('annotationSelection', null);
                    } else {
                    events.fire('annotationSelection', key);
                    }
                    break;
                }
            }
        });
    }

    protected _onAppendChild(element: PcuiElement): void {
        super._onAppendChild(element);

        if (element instanceof AnnotationItem) {
            element.on('click', () => {
                this.emit('click', element);
            });

            element.on('removeClicked', () => {
                this.emit('removeClicked', element);
            });
        }
    }

    protected _onRemoveChild(element: PcuiElement): void {
        if (element instanceof AnnotationItem) {
            element.unbind('click');
            element.unbind('removeClicked');
        }

        super._onRemoveChild(element);
    }
    
}

export { AnnotationList, AnnotationItem };