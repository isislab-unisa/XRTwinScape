import { PlayerCameraElement } from '../playerCameraElement';
import { Splat } from '../splat';
import { Container, Label, Element as PcuiElement } from 'pcui';

import { Element, ElementType } from '../element';
import { Events } from '../events';
import { Scene } from 'playcanvas';

class SceneItem extends Container {
    getName: () => string;
    setName: (value: string) => void;
    getSelected: () => boolean;
    setSelected: (value: boolean) => void;

    constructor(name: string, args = {}) {
        args = {
            ...args,
            class: ['splat-item', 'visible']
        };

        super(args);

        const text = new Label({
            class: 'splat-item-text',
            text: name
        });

        this.append(text);

        this.getName = () => {
            return text.value;
        };

        this.setName = (value: string) => {
            text.value = value;
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

    set name(value: string) {
        this.setName(value);
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

class SceneElements extends Container {
    constructor(events: Events, args = {}) {
        args = {
            ...args,
            class: 'splat-list'
        };

        super(args);

        let splat: Splat;
        let splatItem: SceneItem;
        let playerCamera: PlayerCameraElement;
        let playerCameraItem: SceneItem;

        events.on('scene.elementAdded', (element: Element) => {
            if (element.type === ElementType.splat) {
                splat = element as Splat;
                splatItem = new SceneItem(splat.name);
                this.append(splatItem);
            } else if (element.type === ElementType.playerCamera) {
                playerCamera = element as PlayerCameraElement;
                playerCameraItem = new SceneItem('Player Camera');                
                this.append(playerCameraItem);
            }
        });

        events.on('scene.elementRemoved', (element: Element) => {
            if (element.type === ElementType.splat) {
                splat = null;
                this.remove(splatItem);
                splatItem = null;
            } else if (element.type === ElementType.playerCamera) {
                playerCamera = null;                
                this.remove(playerCameraItem);                
                playerCameraItem = null;
            }
        });

        events.on('selection.splatChanged', (selection: Splat) => {
            if (splatItem) {
                splatItem.selected = (splat === selection);
            }
            if (playerCameraItem) {
                playerCameraItem.selected = false;
            }
        });

        events.on('selection.playerCameraChanged', (selection: PlayerCameraElement) => {
            if (splatItem) {
                splatItem.selected = false;
            }
            if (playerCameraItem) {
                playerCameraItem.selected = (playerCamera === selection);
            }
        });



        events.on('splat.name', (splat: Splat) => {
            if (splatItem) {
                splatItem.name = splat.name;
            }
        });

        this.on('click', (item: SceneItem) => {
            if(item === playerCameraItem) {
                events.fire('playerCamera', playerCamera);
            }
            else if (item === splatItem) {
                events.fire('selection', splat);
            }
        }); 
    }

    protected _onAppendChild(element: PcuiElement): void {
        super._onAppendChild(element);
        if (element instanceof SceneItem) {
            element.on('click', () => {
                this.emit('click', element);
            });
        } 
    }

    protected _onRemoveChild(element: PcuiElement): void {
        if (element instanceof SceneItem) {
            element.unbind('click');
        }

        super._onRemoveChild(element);
    }
}

export { SceneElements, SceneItem };