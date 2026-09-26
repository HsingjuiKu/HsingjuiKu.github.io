// Everything the homepage says, in one place. Placement in the water lives in stage.js.
// Facts are taken from the existing About and project pages.

export const IDENTITY = {
    name: "Xingrui Gu",
    roles: "Researcher · Designer · Entrepreneur",
    place: "San Francisco",
};

// DRAFT copy, to be rewritten in your own voice.
export const ABOUT = {
    lines: [
        "Mathematics and statistics at King’s College London, computer science at UCL and UC Berkeley, research at Berkeley’s BAIR Lab.",
        "Today I build machine learning for radiology at UCSF.",
    ],
    interest:
        "Drawn to geometric measure theory, partial differential equations, and how agents learn from their own experience.",
    link: { label: "Full biography", route: "/about" },
};

// DRAFT one-line notes describing each field, to be replaced with your own framing.
export const INTERESTS = [
    {
        id: "gmt",
        title: "Geometric Measure Theory",
        note: "The geometry of sets and measures: rectifiability, currents, minimal surfaces.",
    },
    {
        id: "pde",
        title: "Partial Differential Equations",
        note: "Flows, diffusion, and the operators that shape them.",
    },
];

// `interest` links a paper to an interest only where the connection is clear from the paper itself.
export const PUBLICATIONS = [
    {
        id: "laplacian",
        short: "Laplacian Flows for Policy Learning",
        title: "Laplacian Flows for Policy Learning from Experience",
        venue: "ICLR 2026 Workshop · Geometry-grounded Representation Learning",
        year: 2026,
        interest: "pde",
        href: "https://openreview.net/forum?id=55FIDiXzvP#discussion",
    },
    {
        id: "belief",
        short: "Cognitive Belief-Driven RL",
        title: "Mimicking Human Intuition: Cognitive Belief-Driven Reinforcement Learning",
        venue: "ICML MoFA 2025 · ICLR 2026",
        year: 2025,
        href: "https://openreview.net/forum?id=LGJJCTjvVQ",
    },
    {
        id: "uncertainty",
        short: "Uncertainty-Gated Generative Modeling",
        title: "Uncertainty-Gated Generative Modeling",
        venue: "ICLR 2026 Workshop · Advances in Financial AI",
        year: 2026,
        href: "https://arxiv.org/abs/2603.07753",
    },
    {
        id: "causkel",
        short: "CauSkelNet",
        title: "CauSkelNet: Causal Representation Learning for Human Behaviour Analysis",
        venue: "IEEE FG 2025",
        year: 2025,
        href: "https://ieeexplore.ieee.org/document/11099310",
    },
    {
        id: "pain",
        short: "Multimodal Pain Recognition",
        title: "Advancing Pain Recognition Through Statistical Correlation-Driven Multimodal Fusion",
        venue: "ACIIW 2024 · IEEE",
        year: 2024,
        href: "https://ieeexplore.ieee.org/document/10970218",
    },
    {
        id: "delegation",
        short: "Delegation Cues for LLM Agents",
        title: "Task-Aware Delegation Cues for LLM Agents",
        venue: "CHI ’26 Workshop · LLM Use as Simulated Research Participants",
        year: 2026,
        href: "https://arxiv.org/abs/2603.11011",
    },
];

// Time as depth: one entry per year, read on the way down.
export const TIMELINE = [
    { year: 2019, items: [{ what: "BSc Mathematics with Statistics", where: "King’s College London" }] },
    { year: 2020, items: [{ what: "Software Engineering Intern", where: "China Automotive Technology and Research Center" }] },
    { year: 2021, items: [{ what: "Co-founder", where: "LJÜS Lighten Us Ltd", until: "2024" }] },
    {
        year: 2022,
        items: [
            { what: "MSc Computer Science", where: "University College London" },
            { what: "KCL Opportunity Fund", where: "Award", honor: true },
        ],
    },
    {
        year: 2023,
        items: [
            { what: "Software Engineering Intern", where: "Microsoft" },
            { what: "“Chunhui Cup” award-winning project", where: "Award", honor: true },
            { what: "¥600k investment intention in LJÜS", where: "Award", honor: true },
        ],
    },
    {
        year: 2024,
        items: [
            { what: "MEng Computer Science", where: "UC Berkeley" },
            { what: "Researcher", where: "BAIR Lab · Helen Wills Neuroscience Institute", until: "2026" },
            { what: "Investment Analyst", where: "INNO Angel Fund" },
        ],
    },
    {
        year: 2025,
        items: [
            { what: "Machine Learning Engineer", where: "Tensor Auto", until: "2026" },
            { what: "BTT Pitch Competition, winner", where: "Los Angeles", honor: true },
        ],
    },
    { year: 2026, items: [{ what: "Machine Learning Engineer", where: "UCSF Radiology at China Basin", until: "now" }] },
];

export const PROJECTS = [
    {
        id: "moodclip",
        title: "MoodClip",
        sub: "Facial emotion recognition",
        years: "2022",
        role: "UX Designer · Technical Developer",
        place: "Shanghai",
        with: "Prof. Zhao Liu",
        tools: "iOS · Python · Miro · Figma",
        desc: "Vintage-photography-inspired UX that elevates mental well-being for the elderly through AI-driven emotion recognition.",
        route: "/moodclip",
    },
    {
        id: "ljus",
        title: "LJÜS",
        sub: "Emotion-driven phototherapy",
        years: "2021 –",
        role: "Co-founder",
        place: "London",
        desc: "Where light speaks without words. Affective-computing phototherapy that crafts a therapeutic ambiance tuned to you.",
        route: "/ljus",
    },
    {
        id: "neuralhear",
        title: "Neural Hear",
        sub: "BCI auditory assessment",
        years: "2022 –",
        role: "Technical Developer · UX Designer",
        place: "London",
        tools: "EEG · Python",
        desc: "Revolutionising the pure-tone hearing test with brain-computer interface technology: precise, non-invasive, accessible.",
        route: "/neuralhear",
    },
    {
        id: "almour",
        title: "Almour",
        sub: "Multisensory learning",
        years: "2022 –",
        role: "Technical Developer · UX Designer",
        place: "Stanford, CA",
        with: "Carey Moncaster, Stanford E-China",
        tools: "Arduino · Figma · Python",
        desc: "Visual and tactile learning tools for deaf children, advancing phonological skills through multisensory design.",
        route: "/almour",
    },
    {
        id: "miniprogram",
        title: "Mini Program",
        sub: "Emotion computation platform",
        years: "2023",
        role: "Algorithm Designer · Developer",
        place: "London",
        with: "Prof. Nadia Berthouze",
        tools: "Python · OpenFace · Arduino",
        desc: "A WeChat-native platform for real-time affective computation and emotion-responsive interaction.",
        route: "/miniprogram",
        pdf: "/assets/miniprogram/COMP0053_Report.pdf",
    },
    {
        id: "rl",
        title: "Smoothed DQN",
        sub: "Reinforcement learning research",
        years: "2023",
        role: "Researcher",
        place: "London",
        with: "Prof. David Barber",
        desc: "Statistical smoothing and probabilistic confidence in deep RL: robust policy learning in high-variance environments.",
        route: "/rl",
        pdf: "/assets/rl/COMP0073_ZYWB7.pdf",
    },
    {
        id: "exerciseapp",
        title: "Exercise App",
        sub: "Physiotherapy platform for the NHS",
        years: "2023",
        role: "UX Designer · Full-stack Developer",
        place: "London",
        with: "Dr. Yun Fu",
        desc: "Bridging clinical rehabilitation and technology with personalised physiotherapy management for patients and clinicians.",
        route: "/exerciseapp",
        pdf: "/assets/exerciseApp/App_Engineering.pdf",
    },
];

// Required by the model's CC BY 4.0 licence.
export const CREDITS = {
    text: "Whale: “Humpback Whale” by dashkilya, CC BY 4.0",
    href: "https://sketchfab.com/3d-models/humpback-whale-38ef05f57bea4de690fab5aed0352a32",
};

export const CONTACT = {
    line: "Find me in the deep.",
    links: [
        { label: "Email", value: "x.gu.hayden@gmail.com", href: "mailto:x.gu.hayden@gmail.com" },
        { label: "GitHub", value: "HsingjuiKu", href: "https://github.com/HsingjuiKu" },
        {
            label: "Scholar",
            value: "Google Scholar",
            href: "https://scholar.google.com/citations?user=bka6_SkAAAAJ&hl=en",
        },
        { label: "LinkedIn", value: "Xingrui Gu", href: "https://www.linkedin.com/in/xingrui-gu-1b22b0236/" },
        { label: "X", value: "@grxprc98", href: "https://x.com/grxprc98" },
        { label: "Instagram", value: "grxprc98", href: "https://www.instagram.com/grxprc98" },
    ],
};
