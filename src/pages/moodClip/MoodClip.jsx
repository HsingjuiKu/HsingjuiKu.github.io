import React from "react";
import ProjectPage from "../../components/ProjectPage/ProjectPage";

const META = [
    { label: "Platform",    value: "iOS · Python · Miro · Figma" },
    { label: "Time",        value: "2022.07 – 2022.09" },
    { label: "Location",    value: "Shanghai, China" },
    { label: "Role",        value: "UX Designer · Technical Developer" },
    { label: "Supervisor",  value: "Prof. Zhao Liu" },
];

const INTRO = `In today's rapidly aging society, the importance of age-appropriate design has never been more paramount. At the heart of the MoodClip mission, under the guidance of Professor Zhao Liu, we delve deep into understanding the unique needs, desires, and aspirations of the elderly — crafting an emotion-centric canvas that bridges vintage memory-triggering aesthetics with cutting-edge AI emotion recognition technology.`;

const TABS = [
    {
        label: "Concept",
        body:  `In the early stages, we conducted market research on health and age-appropriate design tailored for senior citizens. We observed that the majority of the market's solutions centered around physical health considerations. However, with a growing phenomenon of aging individuals living alone — coupled with the evident increase in "empty nest" seniors — there is a stark realization: the psychological well-being of our elderly population faces significant challenges. MoodClip was conceived with a primary focus on exploring age-appropriate solutions dedicated to the mental health of the elderly.`,
    },
    {
        label: "Process",
        body:  `Following our decision to focus on age-appropriate research targeting the mental health of senior citizens, we embarked on meticulous groundwork. Comprehensive field research was undertaken, during which we gathered and analyzed feedback from 103 elderly individuals through questionnaire surveys. A significant revelation was the positive emotional impact of old photographs and other reminiscent elements on the elderly. Recognizing the therapeutic potential of memory-triggering elements, we directed our research endeavors around this pivotal aspect.`,
    },
    {
        label: "Result",
        body:  `In the culmination of our research, we crafted MoodClip — an emotion-centric canvas tailored to resonate with the elderly. Our UI design was deeply rooted in extensive age-appropriate studies, taking into account the unique usage habits of senior citizens. The result was two iterative UI designs, each fine-tuned for intuitive interaction and ease of use. We introduced a product equipped with emotion facial tracking, and emphasized interactive connectivity between devices used by the elderly and their children, pioneering fresh avenues for research in age-appropriate design focused on mental health.`,
    },
];

const IMAGES = [
    "/assets/MoodClip/MoonClip2.png",
    "/assets/MoodClip/MoonClip3.png",
    "/assets/MoodClip/MoonClip4.png",
    "/assets/MoodClip/MoonClip5.png",
    "/assets/MoodClip/MoonClip6.png",
];

const MoodClip = () => (
    <ProjectPage
        title="MoodClip"
        sub="Capturing Essence through Emotion"
        meta={META}
        intro={INTRO}
        tabs={TABS}
        images={IMAGES}
        hero="/assets/MoodClip/MoonClip1.jpg"
        accentColor="#C8A89A"
    />
);

export default MoodClip;