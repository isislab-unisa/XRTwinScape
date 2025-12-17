import { Container, ContainerArgs, Label, TextAreaInput } from 'pcui';
import { Events } from '../events';
import { Tooltips } from './tooltips';
import { Annotation, Activity } from '../annotation';
import { Splat } from '../splat';

class ActivityDetail extends Container {
    private activityInput: TextAreaInput;
    private currentAnnotation: Annotation | null = null;
    private currentSplat: Splat | null = null;

    constructor(events: Events, tooltips: Tooltips, args: ContainerArgs = {}) {
        args = {
            ...args,
            class: 'activity-detail-container'
        };

        super(args);

        const inputRow = new Container({
            class: 'annotationdetail-textAreaRow'
        });

        this.activityInput = new TextAreaInput({
            class: 'annotationdetail-expand',
            placeholder: 'Enter activity objective...'
        });

        inputRow.append(this.activityInput);

        this.append(inputRow);

        this.activityInput.on('change', (value: string) => {
            if (this.currentAnnotation && this.currentSplat && this.currentSplat.annotations) {
                if (!this.currentSplat.annotations.activities) {
                    this.currentSplat.annotations.activities = [];
                }

                const activityId = this.currentAnnotation.activity;
                let activity = this.currentSplat.annotations.activities.find(a => a.activityid === activityId);
                
                if (!activity) {
                    activity = new Activity();
                    activity.activityid = activityId;
                    this.currentSplat.annotations.activities.push(activity);
                }
                
                activity.objective = value;
            }
        });

        events.on('annotationList.selectionChanged', (annotation: Annotation) => {
            this.currentAnnotation = annotation;
            this.currentSplat = events.invoke('selection') as Splat;
            this.updateUI();
        });

        events.on('annotationDetail.activityChanged', (annotation: Annotation) => {
            if (this.currentAnnotation === annotation) {
                this.updateUI();
            }
        });

        this.updateUI();
    }

    private updateUI() {
        if (this.currentAnnotation && this.currentSplat && this.currentSplat.annotations) {
            this.hidden = false;
            const activityId = this.currentAnnotation.activity;
            const activities = this.currentSplat.annotations.activities || [];
            const activity = activities.find(a => a.activityid === activityId);
            this.activityInput.value = activity ? activity.objective : '';
        } else {
            this.hidden = true;
        }
    }
}

export { ActivityDetail };
