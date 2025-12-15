import { Quat, Vec3 } from "playcanvas";
import { Transform } from "./transform";

enum ContentType {Text, Image, Video, Audio};
enum EmotionalState {Bored, Engaged, Frustrated};
enum SkillLevel {Easy, Medium, Hard};
enum ExpertiseLevel {Beginner, Intermediate, Expert};
enum FilterOnType {Emotional, Skill, Expertise};

class Annotation
{
    id: number;
    position: Vec3;    
    defaultContent: AnnotationContent;
    variantContents: AnnotationContent[] = [];
    activity: number;

    constructor(id: number) {
        this.id = id;
    }

    getPivot(mode: 'center' | 'boundCenter', selection: boolean, result: Transform) {
        switch (mode) {
            case 'center':
                result.set(this.position, Quat.IDENTITY, Vec3.ONE);
                break;
            case 'boundCenter':
                // TODO implement alternative for bound center
                result.set(this.position, Quat.IDENTITY, Vec3.ONE);
                break;
        }
    }

}

class AnnotationCamera
{
    position: Vec3;
    rotation: Quat;
}

class BoundingBox
{
    position: Vec3;
    rotation: Quat;
    size: Vec3;
}

class AnnotationContent
{
    content: any;
    contentType: ContentType; // maybe array
    rules: AnnotationRule[] = []; // or maybe single value
}

class AnnotationRule
{
    on: FilterOnType;
    filter: number[] = []; // array of emotionalState, skillLevel or expertiseLevel; maybe single value
}

class Activity
{
    activityid: number;
    objective: string;
}

class AnnotationData
{
    annotations: Annotation[] = [];
    activities: Activity[] = [];
    splat: string;
    camera: AnnotationCamera;
    boundingBox: BoundingBox;
}

export { Annotation, AnnotationContent, AnnotationRule, AnnotationData, AnnotationCamera, BoundingBox, ContentType, EmotionalState, SkillLevel, ExpertiseLevel, FilterOnType}