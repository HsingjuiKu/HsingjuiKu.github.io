/* ── Shared project data (Home gallery + CommandPalette) ────────────────── */
const PROJECTS = [
    {
        id:    "moodclip",
        num:   "01",
        title: "MoodClip",
        sub:   "Facial Emotion Recognition",
        img:   "/assets/cards/moodclip.webp",
        desc:  "Vintage-photography-inspired UX that elevates mental well-being for the elderly through AI-driven emotion recognition.",
        route: "/moodclip",
    },
    {
        id:    "ljus",
        num:   "02",
        title: "LJÜS",
        sub:   "Emotion-Driven Phototherapy",
        img:   "/assets/cards/ljus.webp",
        desc:  "Where light speaks without words. Affective-computing phototherapy that crafts a therapeutic ambiance tuned to you.",
        route: "/ljus",
    },
    {
        id:    "neuralhear",
        num:   "03",
        title: "Neural Hear",
        sub:   "BCI Auditory Assessment",
        img:   "/assets/cards/neuralhear.webp",
        desc:  "Revolutionising the pure-tone hearing test with brain-computer interface technology — precise, non-invasive, accessible.",
        route: "/neuralhear",
    },
    {
        id:    "almour",
        num:   "04",
        title: "Almour",
        sub:   "Multisensory Learning",
        img:   "/assets/cards/almour.webp",
        desc:  "Visual and tactile learning tools for deaf children, advancing phonological skills through multisensory design.",
        route: "/almour",
    },
    {
        id:    "miniprogram",
        num:   "05",
        title: "Mini Program",
        sub:   "Emotion Computation Platform",
        img:   "/assets/cards/miniprogram.webp",
        desc:  "A WeChat-native platform for real-time affective computation and emotion-responsive interaction.",
        route: "/miniprogram",
    },
    {
        id:    "rl",
        num:   "06",
        title: "Smoothed DQN",
        sub:   "RL Research",
        img:   "/assets/cards/rl.webp",
        desc:  "Statistical smoothing + probabilistic confidence in deep RL — robust policy learning in high-variance environments.",
        route: "/rl",
    },
    {
        id:    "exerciseapp",
        num:   "07",
        title: "Exercise App",
        sub:   "Physiotherapy Platform",
        img:   "/assets/cards/exerciseapp.webp",
        desc:  "Bridging clinical rehabilitation and technology with personalised physiotherapy management for patients and clinicians.",
        route: "/exerciseapp",
    },
];

export const EXTERNAL_LINKS = [
    { id: "github", title: "GitHub", sub: "HsingjuiKu", href: "https://github.com/HsingjuiKu" },
    { id: "scholar", title: "Publications", sub: "Google Scholar", href: "https://scholar.google.com/citations?user=bka6_SkAAAAJ&hl=en" },
    { id: "email", title: "Email", sub: "x.gu.hayden@gmail.com", href: "mailto:x.gu.hayden@gmail.com" },
];

export default PROJECTS;
