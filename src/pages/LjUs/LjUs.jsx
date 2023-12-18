import React, { useState } from "react";
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import "./LjUs.scss"
import YouTube from 'react-youtube';

const LjUs = () => {
    const [activeTab, setActiveTab] = useState(0);

    const toTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    const videoId = "e_1jYJT6KJI";

    const opts = {
        height: '550',
        width: '900',
        playerVars: {
            autoplay: 1,
        },
    };
    const onReady = (event) => {
        event.target.pauseVideo();
    }
    return (
        <div className="LjUs">
            <div className="LjUsContainer">
                <div className="logo"><a href="/"><img src="/assets/logo.png" alt="" /></a></div>
                <section>
                    <h2 className="h-t">LJÜS LIGHTEN US LTD</h2>
                    <h3>Interactive Light Therapy Tailored For You</h3>
                    {/*<p>Platform & Tech: Machine Learning, Human Computer Interaction and Human Machine Interaction</p>*/}
                    <p>Time: 2021.12 - Present</p>
                    <p>Location: London,UK</p>
                    <p>Role: Co-Founder</p>
                    <p className="bold" >Theme: Affective Computing, Signal Processing, Human Computer Interaction, Human Machine Interaction</p>
                    {/*<p className="bold" >Video: <a href={"https://youtu.be/e_1jYJT6KJI?si=wHY7yl1DRVUvR1nu"}>L I N K</a></p>*/}
                    {/*<p className="bold" ></p>*/}
                </section>

                <section>
                    <Carousel showThumbs={false} autoPlay={true}>
                        <div>
                            <img src="/assets/LjUs/LjUs Poster.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/LjUs/LjUs 10.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/LjUs/LjUs 11.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/LjUs/LjUs 12.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/LjUs/LjUs 13.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/LjUs/LjUs 15.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/LjUs/LjUs 16.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/LjUs/Behaviour 6.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/LjUs/Behaviour 10.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/LjUs/Behaviour 7.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/LjUs/Behaviour 8.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/LjUs/Behaviour 9.png" alt="" />
                        </div>

                    </Carousel>
                    <h3 style={{ fontWeight: 'bold', fontSize: '30px' }}>Program Introduction</h3>
                    <p className="centered-paragraph">
                        The LJÜS program represents an innovative leap in the integration of lighting technology and emotional wellness. By harnessing Emotion AI, LJÜS delivers a personalized light therapy experience, dynamically adapting to users' emotional states to foster well-being, tranquility, and mood enhancement in any setting.
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
                                LJÜS embodies a new paradigm in personalized light therapy, where minimalistic design meets the power of interaction and emotion. At the heart of LJÜS lies a tension structure, an elegant fusion of slender lines and panels that together form not just a light source, but a wellness companion. Through an intuitive interface, users engage with LJÜS, shaping their light environment by the subtle adjustment of tension, crafting an ambiance that mirrors their mood. The innovation extends beyond mere aesthetics; LJÜS harnesses the subtle language of light to communicate with its users, understanding their emotional state via advanced emotional computation. This allows LJÜS to offer a tailored therapeutic journey, silently responding to the ebbs and flows of the user's emotional wellbeing. In a dance of light and emotion, LJÜS brings forth a sanctuary of serenity. Its modular design provides a scalable solution that fits any space, emphasizing not only functional utility but also personal expression. Each interaction with LJÜS is a step towards balance, making the act of light therapy a deeply personal and transformative experience.
                            </p>
                        </div>
                        <div className={`tab-content-item ${activeTab === 1 ? "active" : ""}`}>
                            <p className="centered-paragraph">
                                Throughout the development of LJÜS, our research was guided by a pursuit of the most natural interaction between humans and light. In our first iteration of the interaction model, we focused on fostering a structural synergy between the user, light, and the luminaire. This led us to incorporate a tensile structure, allowing users to explore and engage with light in the most intuitive and direct manner, thus elevating the act of manipulation into a form of personal exploration and connection. As we evolved into the second generation, our process took a leap forward by integrating unconscious interaction. This marked our inaugural integration of Emotion AI technology. With this advancement, LJÜS was not just a responsive light fixture but became an empathetic entity, equipped with the ability to track and compute human emotions. This deep learning model was a groundbreaking step in our design journey, enabling the light to adapt to the user's emotional state in real-time, creating a symbiotic relationship between the luminaire and its user. The inclusion of this AI model was transformative, marking LJÜS as a pioneer in emotionally intelligent design and setting a new standard for user experience in the domain of light therapy.
                            </p>
                        </div>
                        <div className={`tab-content-item ${activeTab === 2 ? "active" : ""}`}>
                            <p className="centered-paragraph">
                                The culmination of the LJÜS project yielded a luminaire that is much more than a source of light; it's a testament to the harmonious blend of design, technology, and emotional intelligence. The tangible outcomes were striking—a luminaire that could intuitively adapt to the user's emotional state, providing light therapy that was both reactive and proactive in nature. Our Emotion AI technology integration marked a significant milestone in the product's evolution, facilitating a lighting experience that was attuned to the mood and well-being of the user. The sophisticated algorithms within LJÜS could accurately interpret emotional cues, allowing the light to alter its intensity and color temperature in response, thereby creating an environment that supported the user's psychological needs. Further refining our product, we introduced an advanced feature set that included customizable user profiles, enabling a more personalized interaction for each user. These profiles allowed LJÜS to remember individual preferences and emotional responses, thereby ensuring that each interaction was tailored to the user’s historical data and personal patterns. In clinical and home settings alike, LJÜS demonstrated a significant impact on mood improvement, relaxation levels, and overall mental well-being. By enabling users to have a more active role in their emotional health through light therapy, the LJÜS project not only succeeded in its design and functionality goals but also opened up new avenues for therapeutic and ambient lighting applications, setting a benchmark for future innovations in the industry.
                            </p>
                        </div>
                    </div>

                </section>

                {/*<section>*/}
                {/*    <img src="/assets/LjUs/LjUs Poster.png" alt="" style={{ border: '1px solid #000' }} />*/}
                {/*</section>*/}

                <section>
                    <img src="/assets/LjUs/LjUs 10.png" alt="" />
                </section>

                <section>
                    <img src="/assets/LjUs/LjUs 11.png" alt=""/>
                </section>
                <section>
                    <img src="/assets/LjUs/LjUs 12.png" alt="" />
                </section>
                <section>
                    <img src="/assets/LjUs/LjUs 13.png" alt="" />
                </section>
                <section>
                    <img src="/assets/LjUs/LjUs 15.png" alt="" />
                </section>
                <section>
                    <img src="/assets/LjUs/LjUs 16.png" alt="" />
                </section>
                <section>
                    <img src="/assets/LjUs/Behaviour 6.png" alt="" />
                </section>
                <section>
                    <img src="/assets/LjUs/Behaviour 10.png" alt="" />
                </section>
                <section>
                    <img src="/assets/LjUs/Behaviour 7.png" alt="" />
                </section>
                <section>
                    <img src="/assets/LjUs/Behaviour 8.png" alt="" />
                </section>
                <section>
                    <img src="/assets/LjUs/Behaviour 9.png" alt="" />
                </section>

                <section>
                    <h3 style={{ fontWeight: 'bold', fontSize: '30px' }}>YouTube Video</h3>
                    <YouTube videoId={videoId} opts={opts} onReady={onReady} />
                </section>
                {/*<section>*/}
                {/*    <img src="/assets/LjUs/Behaviour 12.png" alt="" />*/}
                {/*</section>*/}
                <div className="footer">
                    <img src="/assets/kn.png" alt="" onClick={toTop} />
                    <p>Copyright © Xingrui GU. All Rights Reserved.</p>
                </div>

            </div>
        </div>
    );

};

export default LjUs