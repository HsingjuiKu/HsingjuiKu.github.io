import React from "react";
import ProjectPage from "../../components/ProjectPage/ProjectPage";

const META = [
    { label: "Platform",  value: "EEG · Python" },
    { label: "Time",      value: "2022.07 – Present" },
    { label: "Location",  value: "London, UK" },
    { label: "Role",      value: "Technical Developer · UX Designer" },
];

const INTRO = `Neural Hear represents a revolutionary breakthrough in auditory health, leveraging EEG signal technology to transform the traditional pure-tone audiometry. This innovative approach captures and analyzes the brain's response to sound frequencies, offering a more accurate, effortless, and accessible hearing assessment. Neural Hear stands at the forefront of auditory care, bringing cutting-edge technology to the service of those seeking comprehensive and reliable hearing solutions.`;

const TABS = [
    {
        label: "Concept",
        body:  `At its core, Neural Hear embodies a transformative concept in auditory health — the fusion of EEG signal analysis with traditional auditory testing methods. This groundbreaking concept redefines the landscape of hearing assessments by tapping into the brain's natural response to sound. Neural Hear transcends the limitations of standard audiometry, offering a more dynamic, user-centric approach to hearing evaluation. By leveraging neural responses, it opens up new possibilities in precision, comfort, and accessibility in hearing care.`,
    },
    {
        label: "Process",
        body:  `Born from a personal battle with deafness and the intimidating isolation of audiometry booths, Neural Hear transcends traditional hearing health approaches. Inspired by pioneering 'EEG frequency sound response' research and AI integration, this innovation breaks down barriers of geography and specialist scarcity. It redefines hearing assessment, moving it beyond clinical confines to a more accessible, inclusive realm — a manifestation of a vision to transform hearing care into an empowering, fear-free experience.`,
    },
    {
        label: "Result",
        body:  `Neural Hear's genesis is deeply rooted in a personal journey — one that began in the silent world of hearing impairment. Grappling with deafness as a child, confined within the sterile walls of audiometry booths, sparked a deep-seated desire to revolutionize hearing health. The integration of 'EEG different frequency sound response identification using neural network and fuzzy techniques' was the eureka moment, enabling nuanced understanding of hearing connected to individual experience. Neural Hear bridges technological innovation and humane sensitivity.`,
    },
];

const IMAGES = [
    "/assets/neuralHear/Neural Hear 1.png",
    "/assets/neuralHear/Neural Hear 2.png",
    "/assets/neuralHear/Neural Hear 3.png",
    "/assets/neuralHear/Neural Hear 4.png",
];

const NeuralHear = () => (
    <ProjectPage
        title="Neural Hear"
        sub="Hear the World, Feel the Sound — Your Guardian of Hearing"
        meta={META}
        intro={INTRO}
        tabs={TABS}
        images={IMAGES}
        hero="/assets/neuralHear/Neural Hear.png"
        accentColor="#9AAFC8"
    />
);

export default NeuralHear;