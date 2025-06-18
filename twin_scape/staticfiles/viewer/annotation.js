import { Vec3 } from 'playcanvas';

// Enums from TypeScript converted to plain JavaScript objects for compatibility
export const ContentType = {
    Text: 0,
    Image: 1,
    Video: 2,
    Audio: 3,
    0: 'Text',
    1: 'Image',
    2: 'Video',
    3: 'Audio'
};

export const EmotionalState = {
    Bored: 0,
    Engaged: 1,
    Frustrated: 2,
    0: 'Bored',
    1: 'Engaged',
    2: 'Frustrated'
};

export const SkillLevel = {
    Easy: 0,
    Medium: 1,
    Hard: 2,
    0: 'Easy',
    1: 'Medium',
    2: 'Hard'
};

export const ExpertiseLevel = {
    Beginner: 0,
    Intermediate: 1,
    Expert: 2,
    0: 'Beginner',
    1: 'Intermediate',
    2: 'Expert'
};

export const FilterOnType = {
    Emotional: 0,
    Skill: 1,
    Expertise: 2,
    0: 'Emotional',
    1: 'Skill',
    2: 'Expertise'
};

// Main Annotation class
export class Annotation {
    id;
    position;
    defaultContent;
    variantContents = [];
    activity;

    constructor(id) {
        this.id = id;
        this.position = new Vec3();
    }
}

// Class for the content of an annotation
export class AnnotationContent {
    content;
    contentType;
    rules = [];
}

// Class for the rules that determine which content to show
export class AnnotationRule {
    on;
    filter = [];
}