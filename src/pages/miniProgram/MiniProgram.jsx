import React, { useState } from "react";
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import "./MiniProgram.scss"

const MiniProgram = () => {
    const [activeTab, setActiveTab] = useState(0);

    const toTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
    return (
        <div className="MiniProgram">
            <div className="MiniProgramContainer">
                <div className="logo"><a href="/home"><img src="/assets/logo.png" alt="" /></a></div>
                <section>
                    <h2 className="h-t">Mini Experiment</h2>
                    <h3>Emotion Intelligence Base on Facial, HRV and RRV</h3>
                    <p>Platform & Tech: Python, Openface, Arduino and Machine Learning
                    </p>
                    <p>Time: 2023.01- 2023.04</p>
                    <p>Location: London,UK</p>
                    <p>Role: Algorithm Designer and Developer</p>
                    <p>Supervisor: Prof.Nadia Berthouze</p>
                    <p className="bold">Theme: Affective Computing, Machine Learning with Multi-modal, Signal Processing</p>
                    <p className="bold">Report Link:<a href="">Link</a></p>

                </section>

                <section>
                    <Carousel showThumbs={false} autoPlay={true}>
                        <div>
                            <img src="/assets/miniprogram/MiniProgram Poster.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/miniprogram/Mini Program1.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/miniprogram/Mini Program2.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/miniprogram/Mini Program3.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/miniprogram/Mini Program4.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/miniprogram/Mini Program5.png" alt="" />
                        </div>
                    </Carousel>
                    <h3 style={{ fontWeight: 'bold', fontSize: '30px' }}>Program Introduction</h3>
                    <p className="centered-paragraph">
                        In the COMP0053 class, we gained an in-depth understanding of the important impact ofemotional health on the body's physical and mental well-being, with a complete hands-onaffective computing experiment led by Professor Nadia Berthouze.
                    </p>
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
                                Affective Computing and Human-RobotInteraction stand at the forefront ofreshaping human-machine relationshipsIn COMP0053, we delve deeply into thisevolving field through hands-onexperiments.Affective computing's corestrength is its ability to close theemotional divide between humans andmachines, enabling robots and softwareto understand and react to humanfeelings. This promises more intuitiveinteractions and solutions attuned tohuman needs.At its heart, the conceptmerges emotional intelligence withtechnology, creating a harmony wheremachines not just compute, but alsoempathize with humans.
                            </p>
                        </div>
                        <div className={`tab-content-item ${activeTab === 1 ? "active" : ""}`}>
                            <p className="centered-paragraph">
                                In the initial stages of our researchprocess, we strategically chose to focuson three primary modalities for dataacquisition: facial expressions, heart rateand respiratory rate. These parameterswere selected based on their provenefficacy in reflecting instantaneousemotional changes. Our aim was tocapture the subtle shifts in users'emotions as they engaged with shortvideo content, providing a dynamic andreal-time perspective of affectiveresponses.To streamline our analysis and ensureclarity in our findings, we narrowed downour emotional spectrum to threecontrasting emotions: Joy, Normal andFear. These emotions were specificallychosen for their distinct physiological andfacial manifestations, allowing for aclearer differentiation and interpretationof the collected data.
                            </p>
                        </div>
                        <div className={`tab-content-item ${activeTab === 2 ? "active" : ""}`}>
                            <p className="centered-paragraph">
                                In the concluding stages of our researchwe implemented a strategic fusionapproach, segmenting it into early.middle, and late phases, to integrate thethree dimensions seamlessly. Particularlyin the late phase, we introduced a featureinfluence factor design. By identifying thesignificance of each dimension, weemployed a weighted average votingmechanism, ensuring that features fromeach dimension were appropriatelyaccounted for, based on their relevanceand impact.This deep fusion method ofcombining different dimensional featureswas not just a theoretical exercise; it boretangible results. By accentuating the mostinfluential features while maintaining theintegrity of all dimensions, we achieved amore holistic representation of the data.The efficacy of this approach wassubstantiated when we observed amarked improvement in the model'srecognition accuracy, showcasing thepotential and versatility of multi-dimensional data fusion in affective

                            </p>
                        </div>
                    </div>

                </section>

                <section>
                    <img src="/assets/miniprogram/Mini Program1.png" alt="" style={{ border: '1px solid #000' }} />
                </section>

                <section>
                    <img src="/assets/miniprogram/Mini Program2.png" alt="" style={{ border: '1px solid #000' }} />
                </section>

                <section>
                    <img src="/assets/miniprogram/Mini Program3.png" alt="" style={{ border: '1px solid #000' }} />
                </section>
                <section>
                    <img src="/assets/miniprogram/Mini Program4.png" alt="" style={{ border: '1px solid #000' }} />
                </section>
                <section>
                    <img src="/assets/miniprogram/Mini Program5.png" alt="" style={{ border: '1px solid #000' }} />
                </section>
                <div className="footer">
                    <img src="/assets/kn.png" alt="" onClick={toTop} />
                    <p>Copyright © Xingrui GU. All Rights Reserved.</p>
                </div>

            </div>
        </div>
    );

};

export default MiniProgram