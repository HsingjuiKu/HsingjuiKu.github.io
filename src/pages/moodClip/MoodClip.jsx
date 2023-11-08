import React, { useState } from "react";
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import "./moodClip.scss"

const MoodClip = () => {
    const [activeTab, setActiveTab] = useState(0);
    const toTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
    return (
        <div className="moodClip">
            <div className="moodClipContainer">
                <div className="logo"><a href="/home"><img src="/assets/logo.png" alt="" /></a></div>
                <section>
                    <h2 className="h-t">MoodClip</h2>
                    <h3>Capturing Essence through Emotion</h3>
                    <p>Platform & Tech: IOS, Python, Miro and Figma
                    </p>
                    <p>Time: 2022.07-2022.09</p>
                    <p>Location: Shanghai, China</p>
                    <p>Role: UX Designer & Technical Developer</p>
                    <p>Supervisor: Prof. Zhao Liu</p>

                </section>

                <section>
                    <Carousel showThumbs={false} autoPlay={true}>
                        <div>
                            <img src="/assets/MoodClip/MoonClip1.jpg" alt="" />
                        </div>
                        <div>
                            <img src="/assets/MoodClip/MoonClip2.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/MoodClip/MoonClip3.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/MoodClip/MoonClip4.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/MoodClip/MoonClip5.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/MoodClip/MoonClip6.png" alt="" />
                        </div>
                    </Carousel>
                    <br/>
                    <br/>
                    <br/>

                    <h3 style={{ fontWeight: 'bold', fontSize: '30px' }}>Program Introduction</h3>
                    <p className="centered-paragraph">
                        In today's rapidly aging society, the importance of age-appropriate design - or "aging gracefully'- has never been more paramount. At the heart of our mission with Behavior, under theesteemed guidance of Professor Zhao Liu, we have delved deep into understanding the uniqueneeds, desires, and aspirations of the elderly.
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
                                In the early stages, we conducted market research on health and age-appropriate design tailored for senior citizens. We observed that the majority of the market's solutions centered around physical health considerations for the elderly. However, with a growing societal phenomenon of aging individuals living alone, coupled with the evident increase in "empty nest" seniors, there's a stark realization: the psychological well-being of our elderly population faces significant challenges. Thus, Behavior was conceived with a primary focus on exploring age-appropriate solutions dedicated to the mental health of the elderly. Our aim is to bridge the gap, addressing the often overlooked but equally crucial aspect of senior citizens' holistic well-being.
                            </p>
                        </div>
                        <div className={`tab-content-item ${activeTab === 1 ? "active" : ""}`}>
                            <p className="centered-paragraph">
                                Following our decision to focus on age-appropriate research targeting the mental health of senior citizens, we embarked on a meticulous groundwork. Comprehensive field research was undertaken, during which we gathered and analyzed feedback from 103 elderly individuals through questionnaire surveys. A significant revelation from our field studies was the positive emotional impact of old photographs and other reminiscent elements on the elderly. Recognizing the potential of such memory-triggering elements, we directed our age-appropriate research endeavors around this pivotal aspect, aiming to harness its therapeutic potential for the betterment of our target demographic's emotional well-being.
                            </p>
                        </div>
                        <div className={`tab-content-item ${activeTab === 2 ? "active" : ""}`}>
                            <p className="centered-paragraph">
                                In the culmination of our research, we crafted the Behavior - an emotion-centric canvas tailored to resonate with the elderly. Our User Interface (UI) design was deeply rooted in extensive age-appropriate studies, taking into account the unique usage habits and preferences of senior citizens. The result was two iterative UI designs, each fine-tuned for intuitive interaction and ease of use. Furthermore, we introduced a product equipped with emotion facial tracking, based on the foundational software of Behavior. Crucially, we emphasized and fostered the interactive connectivity between devices used by the elderly and their children. This innovative approach not only caters to the emotional well-being of the elderly but also pioneers fresh avenues for research in age-appropriate design focused on mental health.
                            </p>
                        </div>
                    </div>

                </section>


                <section>
                    <img src="/assets/MoodClip/MoonClip2.png" alt="" />
                </section>

                <section>
                    <img src="/assets/MoodClip/MoonClip3.png" alt="" />
                </section>

                <section>
                    <img src="/assets/MoodClip/MoonClip4.png" alt="" />
                </section>
                <section>
                    <img src="/assets/MoodClip/MoonClip5.png" alt="" />
                </section>

                <section>
                    <img src="/assets/MoodClip/MoonClip6.png" alt="" />
                </section>


                <div className="footer">
                    <img src="/assets/kn.png" alt="" onClick={toTop} />
                    <p>Copyright © Xingrui GU. All Rights Reserved.</p>

                </div>

            </div>
        </div>
    );

};

export default MoodClip