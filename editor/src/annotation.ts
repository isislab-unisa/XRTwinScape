import { Vec3 } from "playcanvas";

enum ContentType {Text, Image, Video, Audio};
enum EmotionalState {Bored, Engaged, Frustrated};
enum SkillLevel {Easy, Medium, Hard};
enum ExpertiseLevel {Beginner, Intermediate, Expert};
enum FilterOnType {Emotional, Skill, Expertise};
enum FilterType {ShowIf, HideIf};

class Annotation
{
    id: number;
    position: Vec3;
    defaultContent: AnnotationContent;
    variantContents: AnnotationContent[] = [];
    rule: AnnotationRule;
    activity: number;

    constructor(id: number) {
        this.id = id;
    }
}

class AnnotationContent
{
    content: any;
    contentType: ContentType;
    rules: AnnotationRule[] = [];
}

class AnnotationRule
{
    type: FilterType;
    on: FilterOnType;
    filter: any[] = []; // array di emotionalState, skillLevel o expertiseLevel
}

class AnnotationData
{
    annotations: Annotation[] = [];
    splat: string;
}


export { Annotation, AnnotationContent, AnnotationRule, AnnotationData, ContentType, EmotionalState, SkillLevel, ExpertiseLevel, FilterOnType, FilterType}