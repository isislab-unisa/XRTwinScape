import { Container, Label, TextInput, Button } from 'pcui';
import { LessonAsset } from '../xrtwinscape-doc';
import { Events } from '../events';
import { localize } from './localization';

class XR2LearnPublishDialog extends Container {
    show: () => Promise<LessonAsset | null>;
    hide: () => void;
    destroy: () => void;

    constructor(events: Events, args = {}) {
        args = {
            ...args,
            id: 'xr2learn-publish-dialog',
            class: 'settings-dialog',
            hidden: true,
            tabIndex: -1
        };

        super(args);

        const dialog = new Container({
            id: 'dialog'
        });

        // header
        
        const headerText = new Label({ id: 'text', text: "Publish to XR2Learn Marketplace" });
        const header = new Container({ id: 'header' });
        header.append(headerText);

        // name
        const nameLabel = new Label({ class: 'label', text: 'Lesson Name' });
        const nameTextInput = new TextInput({ class: 'text-input', placeholder: 'Enter lesson name' });
        const nameRow = new Container({ class: 'row' });
        nameRow.append(nameLabel);
        nameRow.append(nameTextInput);

        // description
        const descriptionLabel = new Label({ class: 'label', text: 'Lesson Description' });
        const descriptionTextInput = new TextInput({ class: 'text-input', placeholder: 'Enter lesson description' });
        const descriptionRow = new Container({ class: 'row' });
        descriptionRow.append(descriptionLabel);
        descriptionRow.append(descriptionTextInput);

        // tags
        const tagsLabel = new Label({ class: 'label', text: 'Lesson Tags' });
        const tagsTextInput = new TextInput({ class: 'text-input', placeholder: 'Enter lesson tags (comma separated)' });
        const tagsRow = new Container({ class: 'row' });
        tagsRow.append(tagsLabel);
        tagsRow.append(tagsTextInput);

        // image
        const imageLabel = new Label({ class: 'label', text: 'Lesson Image' });
        const imageTextInput = new TextInput({ class: 'text-input', placeholder: 'Enter lesson image URL' });
        const imageRow = new Container({ class: 'row' });
        imageRow.append(imageLabel);
        imageRow.append(imageTextInput);

        // content

        const content = new Container({ id: 'content' });
        content.append(nameRow);
        content.append(descriptionRow);
        content.append(tagsRow);
        content.append(imageRow);

        // footer

        const footer = new Container({ id: 'footer' });

        const cancelButton = new Button({
            class: 'button',
            text: localize('render.cancel')
        });

        const okButton = new Button({
            class: 'button',
            text: localize('popup.ok')
        });

        footer.append(cancelButton);
        footer.append(okButton);

        dialog.append(header);
        dialog.append(content);
        dialog.append(footer);

        this.append(dialog);

        // handle key bindings for enter and escape

        let onCancel: () => void;
        let onOK: () => void;

        cancelButton.on('click', () => onCancel());
        okButton.on('click', () => onOK());

        const keydown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'Escape':
                    onCancel();
                    break;
                case 'Enter':
                    if (!e.shiftKey) onOK();
                    break;
                default:
                    e.stopPropagation();
                    break;
            }
        };

        // reset UI and configure for current state
        const reset = () => {

        };

        // function implementations

        this.show = () => {
            reset();

            this.hidden = false;
            this.dom.addEventListener('keydown', keydown);
            this.dom.focus();

            return new Promise<LessonAsset | null>((resolve) => {
                onCancel = () => {
                    resolve(null);
                };

                onOK = async () => {

                    let imageURL = imageTextInput.value;
                    if (!imageURL || imageURL.trim() === '') {
                        imageURL = 'https://xrtwinscape.di.unisa.it/static/viewer/twinscape_logo.png';
                    }
                    try {
                        new URL(imageURL);
                    } catch {
                        events.invoke('showpopup', {
                            type: 'error',
                            message: 'Please enter a valid image URL'
                        });
                        return;
                    }

                    const imageResponse = await fetch(imageURL);
                    const imageBlob = await imageResponse.blob();
                    const base64Image = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(imageBlob);
                    });

                    const lessonAsset = {
                        name: nameTextInput.value,
                        description: descriptionTextInput.value,
                        tags: tagsTextInput.value.split(',').map(tag => tag.trim()),
                        image: base64Image
                    };
                    resolve(lessonAsset)
                };
            }).finally(() => {
                this.dom.removeEventListener('keydown', keydown);
                this.hide();
            });
        };

        this.hide = () => {
            this.hidden = true;
        };

        this.destroy = () => {
            this.hide();
            super.destroy();
        };
    }
}

export { XR2LearnPublishDialog };
