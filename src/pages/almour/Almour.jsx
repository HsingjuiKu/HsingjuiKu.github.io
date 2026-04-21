import React from "react";
import ProjectPage from "../../components/ProjectPage/ProjectPage";

const META = [
    { label: "Platform",    value: "Arduino · Figma · Python (Deep Learning)" },
    { label: "Time",        value: "2022.09 – Present" },
    { label: "Location",    value: "Stanford, CA" },
    { label: "Role",        value: "Technical Developer · UX Designer" },
    { label: "Supervisor",  value: "Mrs. Carey Moncaster, Stanford E-China" },
];

const INTRO = `The Almour project, emerging from Stanford's E-China program, revolutionizes educational approaches for deaf children. Inspired by the tactile learning experiences of Helen Keller and the project creator's personal journey, Almour focuses on tactile sensory development for the deaf and mute — incorporating diverse sensory inputs like vibrations, pressure, and visual cues to enrich learning through environmental sounds processed by advanced models.`;

const TABS = [
    {
        label: "Concept",
        body:  `The Almour project is a visionary concept in special education, primarily focused on enhancing the learning experiences of deaf children through tactile perception. It innovatively integrates tactile feedback with sophisticated audio processing technologies, enabling deaf children to experience and 'feel' sounds. This approach, inspired by Helen Keller's tactile learning method, transforms sound into tactile stimuli — vibrations and pressure changes — bridging the communication gap and enriching cognitive development. Almour expands the sensory learning landscape, offering a more inclusive educational path.`,
    },
    {
        label: "Process",
        body:  `Born from in-depth interviews with deaf school students, the Almour project is a testament to innovation in deaf education. These interviews shed light on the limitations of current systems, guiding our journey toward more inclusive methods. Our research delved into the crucial role of tactile cognition, unveiling the potential of using touch and sight to compensate for hearing loss. Central to Almour is the Transformer-based algorithm "HTSAT-22", adept at processing audio data through parallel computation and time-sensitive handling.`,
    },
    {
        label: "Result",
        body:  `The Almour project achieved remarkable results. A standout achievement is the algorithm's 98.5% accuracy rate, significantly surpassing traditional CNN and RNN models. In practical application, the project developed an interactive prototype using Arduino, incorporating an inflation device and balloons — a wearable device for the user's arm where the air pump dynamically adjusts to the type and intensity of sounds. This feedback is enhanced by MR (Mixed Reality) devices, offering an immersive visual experience that together creates an unforgettable multimodal teaching experience.`,
    },
];

const IMAGES = [
    "/assets/almour/A1.png",
    "/assets/almour/A2.png",
    "/assets/almour/A3.png",
    "/assets/almour/A4.png",
    "/assets/almour/A5.png",
];

const Almour = () => (
    <ProjectPage
        title="Almour"
        sub="Where Love Echoes in Every Touch"
        meta={META}
        intro={INTRO}
        tabs={TABS}
        images={IMAGES}
        hero="/assets/almour/Almour.png"
        accentColor="#B4A8C8"
    />
);

export default Almour;