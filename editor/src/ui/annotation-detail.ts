import { Container, ContainerArgs, Label, NumericInput, TextAreaInput, TextInput} from 'pcui';
import { Events } from '../events';
import sceneNewSvg from './svg/new.svg';
import sceneDeleteSvg from './svg/delete.svg';
import arrowSvg from './svg/arrow.svg';
import { Tooltips } from './tooltips';
import { Annotation, AnnotationContent, AnnotationData, ContentType, FilterOnType} from 'src/annotation';

const createSvg = (svgString: string) => {
    const decodedStr = decodeURIComponent(svgString.substring('data:image/svg+xml,'.length));
    return new DOMParser().parseFromString(decodedStr, 'image/svg+xml').documentElement;
};

/*
    State: current variant index
    on annotation selected: update current annotation ui, if different from current resent variant index
    on value change: save on annotation, update current annotation ui
    on variant change: update current annotation ui

    update current annotation ui todo: change ui values, hide content rows
       , delete content for hidden content rows, hide arrows, new or delete if disabled
*/

class AnnotationDetail extends Container {
    variantIndex: number;
    annotationToEdit: Annotation;

    constructor(events: Events, tooltips: Tooltips, args: ContainerArgs = {}) {
        args = {
            ...args,
        };

        super(args);

        // position
        const annotationDetailFirst = new Container({
            class: 'annotationdetail-row'
        });

        const annotationDetailIdLabel = new Label({
            class: 'annotationdetail-idlabel',
            text: 'ID:'
        });

        const annotationDetailIdValueLabel = new Label({
            class: 'annotationdetail-idvaluelabel',
            text: '999'
        });

        const annotationDetailActivityLabel = new Label({
            class: 'annotationdetail-activitylabel',
            text: 'Activity:'
        });

        const annotationDetailActivityInput = new NumericInput({
            class: 'annotationdetail-expand',
            precision: 0,
            value: 1,
            min: 1,
            max: 99,
            enabled: true
        });

        annotationDetailFirst.append(annotationDetailIdLabel);
        annotationDetailFirst.append(annotationDetailIdValueLabel);
        annotationDetailFirst.append(annotationDetailActivityLabel);
        annotationDetailFirst.append(annotationDetailActivityInput);

        const annotationDetailSecond = new Container({
            class: 'annotationdetail-row'
        });

        const annotationVariantButtonLeft = new Container({
            class: 'annotationdetail-arrow-button',
            id: 'annotationdetail-flippedButton'
        });
        annotationVariantButtonLeft.dom.appendChild(createSvg(arrowSvg));

        annotationVariantButtonLeft.on('click', async () => {
            await events.fire('annotationDetail.currentVariantButtonLeft');
        });

        const annotationCurrentVariant = new Label({
            class: 'annotationdetail-currentvariantlabel',
            text: 'Default Content'
        });

        const annotationVariantButtonRight = new Container({
            class: 'annotationdetail-arrow-button'
        });
        annotationVariantButtonRight.dom.appendChild(createSvg(arrowSvg));

        annotationVariantButtonRight.on('click', async () => {
            await events.fire('annotationDetail.currentVariantButtonRight');
        });

        const annotationVariantNew = new Container({
            class: 'annotationdetail-contentVariant-button'
        });
        annotationVariantNew.dom.appendChild(createSvg(sceneNewSvg));

        annotationVariantNew.on('click', async () => {
            await events.fire('annotationDetail.newVariant');
        });

        const annotationVariantDelete = new Container({
            class: 'annotationdetail-contentVariant-button'
        });
        annotationVariantDelete.dom.appendChild(createSvg(sceneDeleteSvg));

        annotationVariantDelete.on('click', async () => {
            await events.fire('annotationDetail.deleteVariant');
        });

        annotationDetailSecond.append(annotationVariantButtonLeft);
        annotationDetailSecond.append(annotationCurrentVariant);
        annotationDetailSecond.append(annotationVariantButtonRight);
        annotationDetailSecond.append(annotationVariantNew);
        annotationDetailSecond.append(annotationVariantDelete);

        const annotationDetailThird = new Container({
            class: 'annotationdetail-row'
        });

        const annotationDetailContentLabel = new Label({
            class: 'annotationdetail-contentlabel',
            text: 'CONTENT:'
        });

        const annotationDetailTextContentButton = new Container({
            class: 'annotationdetail-contentVariant-button'
        });
        annotationDetailTextContentButton.dom.appendChild(createSvg(sceneDeleteSvg));

        annotationDetailTextContentButton.on('click', async () => {
            await events.fire('annotationDetail.switchToTextContent');
        });

        tooltips.register(annotationDetailTextContentButton, 'Text Content', 'top');

        const annotationDetailImageContentButton = new Container({
            class: 'annotationdetail-contentVariant-button'
        });
        annotationDetailImageContentButton.dom.appendChild(createSvg(sceneDeleteSvg));

        annotationDetailImageContentButton.on('click', async () => {
            await events.fire('annotationDetail.switchToImageContent');
        });

        tooltips.register(annotationDetailImageContentButton, 'Image Content', 'top');

        const annotationDetailAudioContentButton = new Container({
            class: 'annotationdetail-contentVariant-button'
        });
        annotationDetailAudioContentButton.dom.appendChild(createSvg(sceneDeleteSvg));

        annotationDetailAudioContentButton.on('click', async () => {
            await events.fire('annotationDetail.switchToAudioContent');
        });

        tooltips.register(annotationDetailAudioContentButton, 'Audio Content', 'top');

        const annotationDetailVideoContentButton = new Container({
            class: 'annotationdetail-contentVariant-button'
        });
        annotationDetailVideoContentButton.dom.appendChild(createSvg(sceneDeleteSvg));

        annotationDetailVideoContentButton.on('click', async () => {
            await events.fire('annotationDetail.switchToVideoContent');
        });

        tooltips.register(annotationDetailVideoContentButton, 'Video Content', 'top');

        annotationDetailThird.append(annotationDetailContentLabel);
        annotationDetailThird.append(annotationDetailTextContentButton);
        annotationDetailThird.append(annotationDetailImageContentButton);
        annotationDetailThird.append(annotationDetailAudioContentButton);
        annotationDetailThird.append(annotationDetailVideoContentButton);

        const annotationDetailFourthText = new Container({
            class: 'annotationdetail-textAreaRow'
        });

        const textAreaInput = new TextAreaInput({
            class: 'annotationdetail-expand',            
            placeholder: 'Enter text...'
        });

        textAreaInput.on('change', function (value) {
            console.log('Textarea changed:', value);
        });

        annotationDetailFourthText.append(textAreaInput);

        const annotationDetailFourthImageAudio = new Container({
            class: ['annotationdetail-row', 'annotationdetail-hiddenrow']
        });

        const annotationDetailUploadLabel = new Label({
            class: 'annotationdetail-uploadlabel',
            text: 'Upload'
        });

        const annotationVariantUploadButton = new Container({
            class: 'annotationdetail-contentVariant-button'
        });
        annotationVariantUploadButton.dom.appendChild(createSvg(sceneNewSvg));

        annotationVariantUploadButton.on('click', async () => {
            await events.invoke('annotationDetail.uploadAttachment');
        });

        const annotationDetailUploadFilenameLabel = new Label({
            class: 'annotationdetail-uploadfilenamelabel',
            text: 'FILENAME'
        });

        annotationDetailFourthImageAudio.append(annotationDetailUploadLabel);
        annotationDetailFourthImageAudio.append(annotationVariantUploadButton); 
        annotationDetailFourthImageAudio.append(annotationDetailUploadFilenameLabel);
        
        const annotationDetailFourthLink = new Container({
            class: ['annotationdetail-row', 'annotationdetail-hiddenrow']
        });

        const annotationDetailLinkLabel = new Label({
            class: 'annotationdetail-uploadlabel',
            text: 'Link'
        });

        const linkInput = new TextInput({
            class: 'annotationdetail-expand',            
            placeholder: 'Enter link...'
        });

        linkInput.on('change', function (value) {
            console.log('Link changed:', value);
        });

        annotationDetailFourthLink.append(annotationDetailLinkLabel);
        annotationDetailFourthLink.append(linkInput);

        const annotationDetailFifth = new Container({
            class: 'annotationdetail-row'
        });

        const annotationDetailFiltersLabel = new Label({
            class: 'annotationdetail-filterslabel',
            text: 'FILTERS'
        });

        annotationDetailFifth.append(annotationDetailFiltersLabel);

        const annotationDetailSixth = new Container({
            class: 'annotationdetail-filterrow'
        });

        const annotationVariantBoredButton = new Container({
            class: 'annotationdetail-filterbutton',
        });

        const annotationDetailBoredLabel = new Label({
            class: 'annotationdetail-filterlabel',
            text: 'Bored'
        });
        annotationVariantBoredButton.append(annotationDetailBoredLabel);

        annotationVariantBoredButton.on('click', async () => {
            await events.invoke('annotationDetail.boredFilter');
        });

        const annotationVariantEngagedButton = new Container({
            class: 'annotationdetail-filterbutton',
        });

        const annotationDetailEngagedLabel = new Label({
            class: 'annotationdetail-filterlabel',
            text: 'Engaged'
        });
        annotationVariantEngagedButton.append(annotationDetailEngagedLabel);

        annotationVariantEngagedButton.on('click', async () => {
            await events.invoke('annotationDetail.engagedFilter');
        });

        const annotationVariantFrustratedButton = new Container({
            class: 'annotationdetail-filterbutton',
        });

        const annotationDetailFrustratedLabel = new Label({
            class: 'annotationdetail-filterlabel',
            text: 'Frustrated'
        });
        annotationVariantFrustratedButton.append(annotationDetailFrustratedLabel);

        annotationVariantFrustratedButton.on('click', async () => {
            await events.invoke('annotationDetail.frustratedFilter');
        });

        annotationDetailSixth.append(annotationVariantBoredButton);
        annotationDetailSixth.append(annotationVariantEngagedButton);
        annotationDetailSixth.append(annotationVariantFrustratedButton);

        const annotationDetailSeventh = new Container({
            class: 'annotationdetail-filterrow'
        });

        const annotationVariantEasyButton = new Container({
            class: 'annotationdetail-filterbutton',
        });

        const annotationDetailEasyLabel = new Label({
            class: 'annotationdetail-filterlabel',
            text: 'Easy'
        });
        annotationVariantEasyButton.append(annotationDetailEasyLabel);

        annotationVariantEasyButton.on('click', async () => {
            await events.invoke('annotationDetail.easyFilter');
        });

        const annotationVariantMediumButton = new Container({
            class: 'annotationdetail-filterbutton',
        });

        const annotationDetailMediumLabel = new Label({
            class: 'annotationdetail-filterlabel',
            text: 'Medium'
        });
        annotationVariantMediumButton.append(annotationDetailMediumLabel);

        annotationVariantMediumButton.on('click', async () => {
            await events.invoke('annotationDetail.mediumFilter');
        });

        const annotationVariantHardButton = new Container({
            class: 'annotationdetail-filterbutton',
        });

        const annotationDetailHardLabel = new Label({
            class: 'annotationdetail-filterlabel',
            text: 'Hard'
        });
        annotationVariantHardButton.append(annotationDetailHardLabel);

        annotationVariantHardButton.on('click', async () => {
            await events.invoke('annotationDetail.hardFilter');
        });

        annotationDetailSeventh.append(annotationVariantEasyButton);
        annotationDetailSeventh.append(annotationVariantMediumButton);
        annotationDetailSeventh.append(annotationVariantHardButton);

        const annotationDetailEighth = new Container({
            class: 'annotationdetail-filterrow'
        });

        const annotationVariantBeginnerButton = new Container({
            class: 'annotationdetail-filterbutton',
        });

        const annotationDetailBeginnerLabel = new Label({
            class: 'annotationdetail-filterlabel',
            text: 'Beginner'
        });
        annotationVariantBeginnerButton.append(annotationDetailBeginnerLabel);

        annotationVariantBeginnerButton.on('click', async () => {
            await events.invoke('annotationDetail.beginnerFilter');
        });

        const annotationVariantIntermediateButton = new Container({
            class: 'annotationdetail-filterbutton',
        });

        const annotationDetailIntermediateLabel = new Label({
            class: 'annotationdetail-filterlabel',
            text: 'Intermediate'
        });
        annotationVariantIntermediateButton.append(annotationDetailIntermediateLabel);

        annotationVariantIntermediateButton.on('click', async () => {
            await events.invoke('annotationDetail.intermediateFilter');
        });

        const annotationVariantExpertButton = new Container({
            class: 'annotationdetail-filterbutton',
        });

        const annotationDetailExpertLabel = new Label({
            class: 'annotationdetail-filterlabel',
            text: 'Expert'
        });
        annotationVariantExpertButton.append(annotationDetailExpertLabel);

        annotationVariantExpertButton.on('click', async () => {
            await events.invoke('annotationDetail.expertFilter');
        });

        annotationDetailEighth.append(annotationVariantBeginnerButton);
        annotationDetailEighth.append(annotationVariantIntermediateButton);
        annotationDetailEighth.append(annotationVariantExpertButton);

        this.append(annotationDetailFirst);
        this.append(annotationDetailSecond);
        this.append(annotationDetailThird);
        this.append(annotationDetailFourthLink);
        this.append(annotationDetailFourthImageAudio);
        this.append(annotationDetailFourthText);
        this.append(annotationDetailFifth);
        this.append(annotationDetailSixth);
        this.append(annotationDetailSeventh);
        this.append(annotationDetailEighth);

        const UpdateUI = (annotation: Annotation) => {
            // Hide all annotation detail headers and rows if annotation is null
            const annotationDetailRows = [
            annotationDetailFirst,
            annotationDetailSecond,
            annotationDetailThird,
            annotationDetailFourthLink,
            annotationDetailFourthImageAudio,
            annotationDetailFourthText,
            annotationDetailFifth,
            annotationDetailSixth,
            annotationDetailSeventh,
            annotationDetailEighth
            ];

            if (!annotation) {
            annotationDetailRows.forEach(row => row.class.add('annotationdetail-hiddenrow'));
            return;
            }

            annotationDetailRows.forEach(row => row.class.remove('annotationdetail-hiddenrow'));

            // Change UI values
            annotationDetailIdValueLabel.value = annotation.id.toString();
            annotationDetailActivityInput.value = annotation.activity;
            let curVariant: AnnotationContent;
            curVariant = annotation.defaultContent;
            if (this.variantIndex === 0) {
            annotationCurrentVariant.value = "Default Content";
            } else {
            annotationCurrentVariant.value = "Variant " + this.variantIndex;
            curVariant = annotation.variantContents[this.variantIndex - 1];
            }

            const contentButtons = [
            { button: annotationDetailTextContentButton, type: ContentType.Text },
            { button: annotationDetailImageContentButton, type: ContentType.Image },
            { button: annotationDetailAudioContentButton, type: ContentType.Audio },
            { button: annotationDetailVideoContentButton, type: ContentType.Video }
            ];

            contentButtons.forEach(({ button, type }) => {
            button.class.remove('annotationdetail-contentVariant-button');
            button.class.remove('annotationdetail-contentVariant-selectedbutton');
            button.class.add(
                curVariant.contentType === type
                ? 'annotationdetail-contentVariant-selectedbutton'
                : 'annotationdetail-contentVariant-button'
            );
            });

            // Update UI from current selected variant
            if (curVariant.contentType === ContentType.Text) {
            annotationDetailFourthText.class.remove('annotationdetail-hiddenrow');
            annotationDetailFourthImageAudio.class.add('annotationdetail-hiddenrow');
            annotationDetailFourthLink.class.add('annotationdetail-hiddenrow');
            textAreaInput.value = curVariant.content || '';
            } else if (
            curVariant.contentType === ContentType.Image ||
            curVariant.contentType === ContentType.Audio ||
            curVariant.contentType === ContentType.Video
            ) {
            annotationDetailFourthText.class.add('annotationdetail-hiddenrow');
            annotationDetailFourthImageAudio.class.remove('annotationdetail-hiddenrow');
            annotationDetailFourthLink.class.add('annotationdetail-hiddenrow');
            annotationDetailUploadFilenameLabel.value = curVariant.content || '';
            } else {
            annotationDetailFourthText.class.add('annotationdetail-hiddenrow');
            annotationDetailFourthImageAudio.class.add('annotationdetail-hiddenrow');
            annotationDetailFourthLink.class.remove('annotationdetail-hiddenrow');
            linkInput.value = curVariant.content || '';
            }

            // Update filter buttons
            const filterButtons = [
            { button: annotationVariantBoredButton, type: 'Bored', on: FilterOnType.Emotional },
            { button: annotationVariantEngagedButton, type: 'Engaged', on: FilterOnType.Emotional },
            { button: annotationVariantFrustratedButton, type: 'Frustrated', on: FilterOnType.Emotional },
            { button: annotationVariantEasyButton, type: 'Easy', on: FilterOnType.Skill },
            { button: annotationVariantMediumButton, type: 'Medium', on: FilterOnType.Skill },
            { button: annotationVariantHardButton, type: 'Hard', on: FilterOnType.Skill },
            { button: annotationVariantBeginnerButton, type: 'Beginner', on: FilterOnType.Expertise },
            { button: annotationVariantIntermediateButton, type: 'Intermediate', on: FilterOnType.Expertise },
            { button: annotationVariantExpertButton, type: 'Expert', on: FilterOnType.Expertise }
            ];

            filterButtons.forEach(({ button }) => button.class.remove('annotationdetail-filterbutton-selected'));

            curVariant.rules.forEach(rule => {
            filterButtons
                .filter(({ type, on }) => rule.on === on && rule.filter.includes(type))
                .forEach(({ button }) => button.class.add('annotationdetail-filterbutton-selected'));
            });
        };

        const updateVariantButtons = () => {
            // Disable the left button if at the first variant
            if (this.variantIndex <= 0) {
                annotationVariantButtonLeft.class.add('annotationdetail-contentVariant-disabledbutton');
            } else {
                annotationVariantButtonLeft.class.remove('annotationdetail-contentVariant-disabledbutton');
            }
        
            // Disable the right button if at the last variant
            if (!this.annotationToEdit || this.variantIndex >= this.annotationToEdit.variantContents.length) {
                annotationVariantButtonRight.class.add('annotationdetail-contentVariant-disabledbutton');
            } else {
                annotationVariantButtonRight.class.remove('annotationdetail-contentVariant-disabledbutton');
            }
        
            // Disable the delete button if there are no variant contents or if default content is selected
            if (!this.annotationToEdit || this.variantIndex === 0 || this.annotationToEdit.variantContents.length === 0) {
                annotationVariantDelete.class.add('annotationdetail-contentVariant-disabledbutton');
            } else {
                annotationVariantDelete.class.remove('annotationdetail-contentVariant-disabledbutton');
            }
        };
        
        UpdateUI(null);
        updateVariantButtons();

        annotationDetailActivityInput.on('change', () => {
            this.annotationToEdit.activity = annotationDetailActivityInput.value;
            events.fire('annotationDetail.activityChanged', this.annotationToEdit);
        });

        events.on('annotationList.selectionChanged', (annotation: Annotation) => {
            this.variantIndex = 0;
            this.annotationToEdit = annotation;
            UpdateUI(annotation);
            updateVariantButtons();
        });

        events.on('annotationDetail.currentVariantButtonLeft', () => {
            if (this.variantIndex > 0) 
            {
                this.variantIndex--;
                UpdateUI(this.annotationToEdit);
                updateVariantButtons();
            }
        });

        events.on('annotationDetail.currentVariantButtonRight', () => {
            if (this.variantIndex < this.annotationToEdit.variantContents.length) 
            {
                this.variantIndex++;
                UpdateUI(this.annotationToEdit);
                updateVariantButtons();
            }
        });

        events.on('annotationDetail.newVariant', () => {
            const newVariant = new AnnotationContent();
            newVariant.contentType = ContentType.Text;
            newVariant.content = '';
            this.annotationToEdit.variantContents.push(newVariant);            
            this.variantIndex = this.annotationToEdit.variantContents.length;
            UpdateUI(this.annotationToEdit);
            updateVariantButtons();
        });

        events.on('annotationDetail.deleteVariant', () => {
            if (this.variantIndex > 0 && this.variantIndex <= this.annotationToEdit.variantContents.length) 
            {
                this.annotationToEdit.variantContents.splice(this.variantIndex - 1, 1);
                if (this.variantIndex > this.annotationToEdit.variantContents.length) 
                {
                    this.variantIndex = this.annotationToEdit.variantContents.length;
                }
                UpdateUI(this.annotationToEdit);
                updateVariantButtons();
            }
        });

        events.on('annotationDetail.switchToTextContent', () => {
            if (this.annotationToEdit) {
                const currentVariant = this.annotationToEdit.variantContents[this.variantIndex - 1] || this.annotationToEdit.defaultContent;
                currentVariant.contentType = ContentType.Text;
                currentVariant.content = '';
                UpdateUI(this.annotationToEdit);
            }
        });

        events.on('annotationDetail.switchToImageContent', () => {
            if (this.annotationToEdit) {
                const currentVariant = this.annotationToEdit.variantContents[this.variantIndex - 1] || this.annotationToEdit.defaultContent;
                currentVariant.contentType = ContentType.Image;
                currentVariant.content = '';
                UpdateUI(this.annotationToEdit);
            }
        });

        events.on('annotationDetail.switchToAudioContent', () => {
            if (this.annotationToEdit) {
                const currentVariant = this.annotationToEdit.variantContents[this.variantIndex - 1] || this.annotationToEdit.defaultContent;
                currentVariant.contentType = ContentType.Audio;
                currentVariant.content = '';
                UpdateUI(this.annotationToEdit);
            }
        });

        events.on('annotationDetail.switchToVideoContent', () => {
            if (this.annotationToEdit) {
                const currentVariant = this.annotationToEdit.variantContents[this.variantIndex - 1] || this.annotationToEdit.defaultContent;
                currentVariant.contentType = ContentType.Video;
                currentVariant.content = '';
                UpdateUI(this.annotationToEdit);
            }
        });

        textAreaInput.on('change', (value) => {
            if (this.annotationToEdit) {
            const currentVariant = this.annotationToEdit.variantContents[this.variantIndex - 1] || this.annotationToEdit.defaultContent;
            if (currentVariant.contentType === ContentType.Text) {
                currentVariant.content = value;
            }
            }
        });

        linkInput.on('change', (value) => {
            if (this.annotationToEdit) {
            const currentVariant = this.annotationToEdit.variantContents[this.variantIndex - 1] || this.annotationToEdit.defaultContent;
            if (currentVariant.contentType === ContentType.Video) {
                currentVariant.content = value;
            }
            }
        });

        annotationVariantUploadButton.on('click', async () => {
            if (!this.annotationToEdit) return;

            const currentVariant = this.annotationToEdit.variantContents[this.variantIndex - 1] || this.annotationToEdit.defaultContent;

            // Create a file input element
            const fileInput = document.createElement('input');
            fileInput.type = 'file';

            // Set accepted file types based on the current content type
            if (currentVariant.contentType === ContentType.Image) {
                fileInput.accept = 'image/*';
            } else if (currentVariant.contentType === ContentType.Audio) {
                fileInput.accept = 'audio/*';
            } else if (currentVariant.contentType === ContentType.Video) {
                fileInput.accept = 'video/*';                  
            } else {
                console.warn('Unsupported content type for file upload');
                return;
            }

            // Trigger the file dialog
            fileInput.click();

            // Handle file selection
            fileInput.onchange = () => {
                if (fileInput.files && fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    annotationDetailUploadFilenameLabel.value = file.name;
                    currentVariant.content = file.name;

                    // Optionally, you can handle file upload logic here
                    console.log('Selected file:', file);
                }
            };
        });

        const toggleFilter = (button: Container, type: string, on: FilterOnType) => {
            const currentVariant = this.annotationToEdit.variantContents[this.variantIndex - 1] || this.annotationToEdit.defaultContent;

            let rule = currentVariant.rules.find(r => r.on === on);
            if (!rule)
            {
                rule = { on, filter: [] };
                currentVariant.rules.push(rule);
            }

            if (button.class.contains('annotationdetail-filterbutton-selected')) 
            {
                button.class.remove('annotationdetail-filterbutton-selected');
                rule.filter = rule.filter.filter(f => f !== type);
            } 
            else
            {
                button.class.add('annotationdetail-filterbutton-selected');
                rule.filter.push(type);
            }

            // Remove the rule if no filters are left
            if (rule.filter.length === 0) 
            {
                currentVariant.rules = currentVariant.rules.filter(r => r !== rule);
            }
        };

        annotationVariantBoredButton.on('click', () => {
            toggleFilter(annotationVariantBoredButton, 'Bored', FilterOnType.Emotional);
        });

        annotationVariantEngagedButton.on('click', () => {
            toggleFilter(annotationVariantEngagedButton, 'Engaged', FilterOnType.Emotional);
        });

        annotationVariantFrustratedButton.on('click', () => {
            toggleFilter(annotationVariantFrustratedButton, 'Frustrated', FilterOnType.Emotional);
        });

        annotationVariantEasyButton.on('click', () => {
            toggleFilter(annotationVariantEasyButton, 'Easy', FilterOnType.Skill);
        });

        annotationVariantMediumButton.on('click', () => {
            toggleFilter(annotationVariantMediumButton, 'Medium', FilterOnType.Skill);
        });

        annotationVariantHardButton.on('click', () => {
            toggleFilter(annotationVariantHardButton, 'Hard', FilterOnType.Skill);
        });

        annotationVariantBeginnerButton.on('click', () => {
            toggleFilter(annotationVariantBeginnerButton, 'Beginner', FilterOnType.Expertise);
        });

        annotationVariantIntermediateButton.on('click', () => {
            toggleFilter(annotationVariantIntermediateButton, 'Intermediate', FilterOnType.Expertise);
        });

        annotationVariantExpertButton.on('click', () => {
            toggleFilter(annotationVariantExpertButton, 'Expert', FilterOnType.Expertise);
        });

    }
}

export { AnnotationDetail };