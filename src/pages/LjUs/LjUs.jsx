import React from "react";
import ProjectPage from "../../components/ProjectPage/ProjectPage";

const META = [
    { label: "Time",      value: "2021.12 – Present" },
    { label: "Location",  value: "London, UK" },
    { label: "Role",      value: "Co-Founder" },
    { label: "Milestone", value: "¥1.5M Investment Intent" },
    { label: "Theme",     value: "Affective Computing · Signal Processing · HCI · HMI" },
];

const INTRO = `The LJÜS program represents an innovative leap in the integration of lighting technology and emotional wellness. By harnessing Emotion AI, LJÜS delivers a personalized light therapy experience, dynamically adapting to users' emotional states to foster well-being, tranquility, and mood enhancement in any setting.`;

const TABS = [
    {
        label: "Concept",
        body:  `LJÜS embodies a new paradigm in personalized light therapy, where minimalistic design meets the power of interaction and emotion. At the heart of LJÜS lies a tension structure, an elegant fusion of slender lines and panels that together form not just a light source, but a wellness companion. Through an intuitive interface, users engage with LJÜS, shaping their light environment by the subtle adjustment of tension, crafting an ambiance that mirrors their mood. LJÜS harnesses the subtle language of light to communicate with its users, understanding their emotional state via advanced emotional computation.`,
    },
    {
        label: "Process",
        body:  `Throughout the development of LJÜS, our research was guided by a pursuit of the most natural interaction between humans and light. In our first iteration, we focused on fostering a structural synergy between the user, light, and the luminaire — incorporating a tensile structure that allows users to explore light in the most intuitive and direct manner. As we evolved into the second generation, our process integrated unconscious interaction via Emotion AI technology. LJÜS became an empathetic entity, equipped to track and compute human emotions in real-time.`,
    },
    {
        label: "Result",
        body:  `The culmination of the LJÜS project yielded a luminaire that is much more than a source of light — it is a testament to the harmonious blend of design, technology, and emotional intelligence. Our Emotion AI integration facilitated a lighting experience attuned to the mood and well-being of the user. In clinical and home settings alike, LJÜS demonstrated a significant impact on mood improvement, relaxation, and overall mental well-being, setting a benchmark for future innovations in therapeutic ambient lighting.`,
    },
];

const IMAGES = [
    "/assets/LjUs/LjUs 10.png",
    "/assets/LjUs/LjUs 11.png",
    "/assets/LjUs/LjUs 12.png",
    "/assets/LjUs/LjUs 13.png",
    "/assets/LjUs/LjUs 15.png",
    "/assets/LjUs/LjUs 16.png",
    "/assets/LjUs/Behaviour 6.png",
    "/assets/LjUs/Behaviour 10.png",
    "/assets/LjUs/Behaviour 7.png",
    "/assets/LjUs/Behaviour 8.png",
    "/assets/LjUs/Behaviour 9.png",
];

const LjUs = () => (
    <ProjectPage
        title="LJÜS"
        sub="Interactive Light Therapy Tailored For You"
        meta={META}
        intro={INTRO}
        tabs={TABS}
        images={IMAGES}
        hero="/assets/LjUs/LjUs Poster.png"
        videoId="e_1jYJT6KJI"
        accentColor="#C8B89A"
    />
);

export default LjUs;