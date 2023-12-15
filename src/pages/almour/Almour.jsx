import React, { useState } from "react";
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import "./Almour.scss"

const Almour = () => {
    const [activeTab, setActiveTab] = useState(0);
    const toTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
    return (
        <div className="almour">
            <div className="almourContainer">
                <div className="logo"><a href="/"><img src="/assets/logo.png" alt="" /></a></div>
                <section>
                    <h2 className="h-t">Almour</h2>
                    <h3>Where Love Echoes in Every Touch</h3>
                    <p>Platform & Tech: Arduino, Figma and Python(Deep Learning)</p>
                    <p>Time: 2022.09-Present</p>
                    <p>Location: Stanford, CA</p>
                    <p>Role: Technical Developer and UX Designer</p>
                    <p>Supervisor: Mrs. Carey Moncaster in Stanford E-China, Stanford University</p>

                </section>

                <section>
                    <Carousel showThumbs={false} autoPlay={true}>
                        <div>
                            <img src="/assets/almour/Almour.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/almour/A1.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/almour/A2.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/almour/A3.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/almour/A4.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/almour/A5.png" alt="" />
                        </div>
                    </Carousel>
                    <br/>
                    <br/>
                    <br/>

                    <h3 style={{ fontWeight: 'bold', fontSize: '30px' }}>Program Introduction</h3>
                    <p className="centered-paragraph">
                        The Almour project, emerging from Stanford's E-China program and lauded by Carey Moncaster, revolutionizes educational approaches for deaf children. It draws inspiration from the tactile learning experiences of Helen Keller and the project creator's personal journey, focusing on tactile sensory development for the deaf and mute. Almour is designed to tackle the unique challenges deaf children face, such as language delays and social barriers, by incorporating tactile feedback methods, reminiscent of Keller's learning techniques. This innovative project employs diverse sensory inputs like vibrations, pressure, and visual cues to enrich learning. It harnesses environmental sounds, processed through advanced models like HTSAT-22, enabling children to 'feel' sounds and better grasp their environment. This strategy aids not just in language acquisition but also in boosting cognitive and spatial skills. Reflecting a deep commitment to inclusivity and interaction, Almour's design process and prototypes create a learning space where deaf children can perceive and engage with the world in new ways. This blend of personal inspiration, cutting-edge technology, and educational insight marks Almour as a groundbreaking step in empowering deaf children educationally and personally.
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
                                The Almour project is a visionary concept in special education, primarily focused on enhancing the learning experiences of deaf children through tactile perception. It innovatively integrates tactile feedback with sophisticated audio processing technologies, enabling deaf children to experience and 'feel' sounds. This approach, inspired by Helen Keller's tactile learning method, transforms sound into tactile stimuli, such as vibrations and pressure changes, thus bridging the communication gap and enriching cognitive development. Almour's concept is not merely about compensating for auditory limitations but about expanding the sensory learning landscape, offering a more inclusive and impactful educational path for deaf children.
                            </p>
                        </div>
                        <div className={`tab-content-item ${activeTab === 1 ? "active" : ""}`}>
                            <p className="centered-paragraph">
                                Born from in-depth interviews with deaf school students, the Almour project is a testament to innovation in deaf education. These interviews shed light on the limitations of current systems, guiding our journey towards more inclusive methods. Our research delved into the crucial role of tactile cognition, unveiling the potential of using touch and sight to compensate for hearing loss. This insight birthed Almour's multimodal teaching concept, aimed at crafting a holistic learning environment for deaf children. Central to Almour is a Transformer-based algorithm “HTSAT-22", adept at processing audio data through parallel computation and time-sensitive handling. This choice was pivotal for converting intricate sound patterns into understandable tactile and visual cues. Almour stands as a beacon of hope, bridging communication barriers and enriching the educational experience of deaf children by transforming sounds into tangible and visual forms.
                            </p>
                        </div>
                        <div className={`tab-content-item ${activeTab === 2 ? "active" : ""}`}>
                            <p className="centered-paragraph">
                                The Almour project has achieved remarkable results in its aim to revolutionize the learning experience for deaf children. A standout achievement is the algorithm's impressive 98.5% accuracy rate, significantly surpassing the performance of traditional CNN and RNN models. This high level of precision demonstrates the algorithm's exceptional ability to process and classify a wide range of environmental sounds, making it a crucial component of the project. In terms of practical application, the project successfully developed an interactive prototype using Arduino, incorporating an inflation device and balloons. This setup allowed for the creation of a wearable device for the user's arm. The air pump in the device dynamically adjusts to the type and intensity of sounds, providing tactile feedback that complements the auditory input. This feedback is further enhanced by MR (Mixed Reality) devices, offering an immersive visual experience. Together, these elements combine to give deaf children an unforgettable multimodal teaching experience. By engaging both the sense of touch and sight, Almour has created a unique and effective educational tool that bridges the gap in communication and learning for deaf children. This innovative approach not only caters to their current educational needs but also opens up new possibilities for their cognitive and social development.
                            </p>
                        </div>
                    </div>

                </section>


                <section>
                    <img src="/assets/almour/A1.png" alt="" />
                </section>

                <section>
                    <img src="/assets/almour/A2.png" alt="" />
                </section>

                <section>
                    <img src="/assets/almour/A3.png" alt="" />
                </section>
                <section>
                    <img src="/assets/almour/A4.png" alt="" />
                </section>
                <section>
                    <img src="/assets/almour/A5.png" alt="" />
                </section>


                <div className="footer">
                    <img src="/assets/kn.png" alt="" onClick={toTop} />
                    <p>Copyright © Xingrui GU. All Rights Reserved.</p>

                </div>

            </div>
        </div>
    );

};

export default Almour