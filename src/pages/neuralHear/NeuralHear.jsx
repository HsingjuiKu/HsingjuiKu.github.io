import React, { useState } from "react";
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import "./NeuralHear.scss"

const NeuralHear = () => {
    const [activeTab, setActiveTab] = useState(0);
    const toTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
    return (
        <div className="neuralHear">
            <div className="neuralHearContainer">
                <div className="logo"><a href="/"><img src="/assets/logo.png" alt="" /></a></div>
                <section>
                    <h2 className="h-t">Neural Hear</h2>
                    <h3>Hear the World, Feel the Sound - Your Guardian of Hearing.</h3>
                    <p>Platform & Tech: EEG and Python
                    </p>
                    <p>Time: 2022.07-Present</p>
                    <p>Location: London, UK</p>
                    <p>Role: Technical Developer and UX Designer</p>
                    {/*<p>Supervisor: Prof. Zhao Liu</p>*/}

                </section>

                <section>
                    <Carousel showThumbs={false} autoPlay={true}>
                        <div>
                            <img src="/assets/neuralHear/Neural Hear.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/neuralHear/Neural Hear 1.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/neuralHear/Neural Hear 2.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/neuralHear/Neural Hear 3.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/neuralHear/Neural Hear 4.png" alt="" />
                        </div>
                    </Carousel>
                    <br/>
                    <br/>
                    <br/>

                    <h3 style={{ fontWeight: 'bold', fontSize: '30px' }}>Program Introduction</h3>
                    <p className="centered-paragraph">
                        Neural Hear represents a revolutionary breakthrough in auditory health, leveraging EEG signal technology to transform the traditional pure-tone audiometry. This innovative approach addresses the challenges of conventional hearing tests by capturing and analyzing the brain's response to sound frequencies, offering a more accurate, effortless, and accessible hearing assessment. Neural Hear stands at the forefront of auditory care, bringing cutting-edge technology to the service of those seeking comprehensive and reliable hearing solutions.
                    </p>
                    <br/>
                    <br/>
                    <br/>
                    <div className="tabs">
                        <div className={`tab ${activeTab === 0 ? "active" : ""}`} onClick={() => setActiveTab(0)}>
                            Concept
                        </div>
                        <div className={`tab ${activeTab === 1 ? "active" : ""}`} onClick={() => setActiveTab(1)}>
                            Process
                        </div>
                        <div className={`tab ${activeTab === 2 ? "active" : ""}`} onClick={() => setActiveTab(2)}>
                            Result
                        </div>
                    </div>
                    <div className="tab-content">
                        <div className={`tab-content-item ${activeTab === 0 ? "active" : ""}`}>
                            <p className="centered-paragraph">
                                At its core, Neural Hear embodies a transformative concept in auditory health - the fusion of EEG signal analysis with traditional auditory testing methods. This groundbreaking concept redefines the landscape of hearing assessments by tapping into the brain's natural response to sound. Neural Hear transcends the limitations of standard audiometry, offering a more dynamic, user-centric approach to hearing evaluation. By leveraging neural responses, it opens up new possibilities in precision, comfort, and accessibility in hearing care, marking a significant leap forward in how we understand and address auditory health.
                            </p>
                        </div>
                        <div className={`tab-content-item ${activeTab === 1 ? "active" : ""}`}>
                            <p className="centered-paragraph">
                                Born from a personal battle with deafness and the intimidating isolation of audiometry booths, Neural Hear transcends traditional hearing health approaches. Inspired by pioneering 'EEG frequency sound response' research and AI integration, this innovation breaks down barriers of geography and specialist scarcity. It redefines hearing assessment, moving it beyond clinical confines to a more accessible, inclusive realm. Neural Hear is not just a product but a manifestation of a vision to transform hearing care into an empowering, fear-free experience, merging technological advancement with a deeply human touch.
                            </p>
                        </div>
                        <div className={`tab-content-item ${activeTab === 2 ? "active" : ""}`}>
                            <p className="centered-paragraph">
                                The genesis of Neural Hear is deeply rooted in a personal journey – one that began in the silent world of hearing impairment. As someone who grappled with deafness, I found myself often confined within the sterile, intimidating walls of audiometry booths as a child. Those moments, filled with isolation and fear, sparked a deep-seated desire within me to revolutionize the way we approach hearing health. This desire was not just about transforming a process; it was about reimagining an experience. I envisioned a world where geographical barriers and the scarcity of audiologists were no longer obstacles in accessing quality hearing care. Neural Hear was conceived to break down these barriers, to bring the testing process out of the clinical rooms and into a space that is accessible, comfortable, and inclusive.

                                My inspiration was further fueled by the groundbreaking research in 'EEG different frequency sound response identification using neural network and fuzzy techniques.' This paper opened my eyes to the potential of integrating EEG signal analysis with AI-driven methods to reinterpret how we understand and assess hearing. It was a eureka moment – the realization that we could harness the power of technology not just to test hearing but to understand it in a way that's nuanced and deeply connected to the individual's experience. Neural Hear, therefore, is more than just a product; it's the embodiment of a personal quest to empower individuals to protect and cherish their hearing. It represents a bridge between technological innovation and humane sensitivity, ensuring that hearing care is no longer a journey marked by fear, but one that is empowering, enlightening, and accessible to all.
                            </p>
                        </div>
                    </div>

                </section>


                <section>
                    <img src="/assets/neuralHear/Neural Hear 1.png" alt="" />
                </section>

                <section>
                    <img src="/assets/neuralHear/Neural Hear 2.png" alt="" />
                </section>

                <section>
                    <img src="/assets/neuralHear/Neural Hear 3.png" alt="" />
                </section>
                <section>
                    <img src="/assets/neuralHear/Neural Hear 4.png" alt="" />
                </section>


                <div className="footer">
                    <img src="/assets/kn.png" alt="" onClick={toTop} />
                    <p>Copyright © Xingrui GU. All Rights Reserved.</p>

                </div>

            </div>
        </div>
    );

};

export default NeuralHear