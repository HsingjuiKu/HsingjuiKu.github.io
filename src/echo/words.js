// The words of the About page — kept few. Nothing here refers to, or could reveal, a birth
// date or any personal data.

export const NAME = { zh: "谷星锐", en: "Xingrui Gu", roles: "Researcher · Designer · Entrepreneur" };

// The short introduction is a DRAFT, adapted from the original About page.
export const ABOUT = {
    heading: "Geometry, analysis, learning.",
    intro: [
        "I am interested in what it means for an artificial agent to learn from its own experience — intelligence that grows out of long interaction, not static datasets or hand-written rules.",
        "Trained in mathematics at King’s College London and computer science at UCL and UC Berkeley, I studied operator views of learning with David Barber, and how human working memory shapes credit and concepts with Anne Collins. I now build machine learning for radiology at UCSF.",
    ],
    research: ["Geometric measure theory", "Partial differential equations", "Learning theory"],
    interests: ["World models", "Reinforcement learning", "Quantitative finance"],
};

// Each area bends the surface its own way: toward the catenoid, the helicoid, or between.
export const RESEARCH = {
    heading: "Selected papers.",
    areas: [
        { id: "gmt", title: "Geometric measure theory", theta: 0 },
        { id: "pde", title: "Partial differential equations", theta: Math.PI / 2 },
        { id: "learning", title: "Learning theory", theta: Math.PI / 4 },
    ],
    figure: "A catenoid bending into a helicoid — minimal all the way.",
};

export const JOURNEY = {
    figure: "A ring for each year, widest where the year held most.",
};

export const CONTACT_HEADING = "Send a signal.";
