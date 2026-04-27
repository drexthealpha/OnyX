import type { ResearchState } from "../types.js";
export interface SlideOutline {
    title: string;
    slides: Slide[];
}
export interface Slide {
    slideNumber: number;
    title: string;
    bulletPoints: string[];
    speakerNotes?: string;
}
export declare function toSlidesOutline(state: ResearchState): Promise<SlideOutline>;
//# sourceMappingURL=slides.d.ts.map