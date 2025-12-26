import React from "react";
import "./home.scss";
import { useNavigate } from 'react-router-dom';

// Home component
const Home = () => {
    const toTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
    let navigate = useNavigate();
    return (
        <div className="home">
            <div className="homeContainer">
                <div className="logo"><a href="/"><img src="/assets/logo.png" alt="" /></a></div>
                <div className="banner">
                    <video src="/assets/home.mp4" muted autoPlay loop style={{ width: '100%' }}></video>
                </div>
                <section>
                    <h2 className="h-t">X.GU</h2>
                    {/*<p className="h-p">A romantic AI Interaction Engineer,Data Scientist in addition to being an artist and poet</p>*/}
                    <br/>
                    <br/>
                    <div className="btns">
                        <div className="btn" onClick={() => navigate(process.env.PUBLIC_URL + '/about')}>
                            ABOUT ME
                        </div>
                        <div className="btn" onClick={() => { window.location.href = "https://github.com/HsingjuiKu" }}>
                            GITHUB
                        </div>
                        <div className="btn" onClick={() => { window.location.href = "https://scholar.google.com/citations?user=bka6_SkAAAAJ&hl=en" }}>
                            PUBLICATION
                        </div>
                    </div>
                </section>

                <section>
                    <img src="/assets/MoodClip/MoonClip1.jpg" alt="" />
                    <p className="centered-paragraph">
                        Drawing inspiration from the artistry of vintage photographs, we delve into the intricate tapestry of facial emotion recognition. With a keen focus on elevating the mental and physical well-being of the elderly, Behavior crafts a meticulously designed UX canvas. A seamless interface that transcends age, uniting past aesthetics with future technologies, to resonate deeply and heal holistically.
                    </p>
                    <div className="btn" onClick={() => navigate(process.env.PUBLIC_URL + '/moodclip')}>
                        START JOURNEY
                    </div>
                </section>


                <section>
                    <img src="/assets/LjUs Poster.png" alt="" />
                    <p className="centered-paragraph">Experience the profound interaction of phototherapy, where words are superfluous, and light speaks. We tune into your emotions, crafting a unique therapeutic ambiance through emotion computation. Here, health is not just monitored; it's cherished and nurtured. Let LjUs guide you into the warmth of illumination, embracing your true self.</p>
                    {/*<p>Experience the profound interaction of phototherapy, where words are superfluous, and light speaks. We tuneinto your emotions, crafting a unique therapeutic ambiance through emotion computation. Here, health is not justmonitored; it's cherished and nurtured. Let LjUs guide you into the warmth of illumination, embracing your trueself.</p>*/}
                    <div className="btn" onClick={() => navigate(process.env.PUBLIC_URL + '/ljus')}>
                        START JOURNEY
                    </div>
                </section>

                <section>
                    <img src="/assets/neuralHear/Neural Hear.png" alt="" />
                    <p className="centered-paragraph">Neural Hear is a groundbreaking innovation in auditory health, revolutionizing the traditional pure-tone hearing test with advanced brain-computer interface technology. Designed to capture the brain's direct response to sound frequencies, it eliminates subjective feedback, offering a more accurate and effortless hearing assessment. With Neural Hear, experience the future of hearing tests — precise, non-invasive, and accessible to all.</p>
                    <div className="btn" onClick={() => navigate(process.env.PUBLIC_URL + '/neuralhear')}>
                        START JOURNEY
                    </div>
                </section>

                <section>
                    <img src="/assets/almour/Almour.png" alt="" />
                    <p className="centered-paragraph">Almour is designed for deaf children, utilizing visual and tactile elements to enhance learning. It integrates multisensory techniques to compensate for hearing loss, focusing on improving phonological skills and cognitive development.</p>
                    <div className="btn" onClick={() => navigate(process.env.PUBLIC_URL + '/almour')}>
                        START JOURNEY
                    </div>
                </section>

                <section>
                    <img src="/assets/miniprogram/MiniProgram Poster.png" alt="" />
                    <p className="centered-paragraph">Experience the profound interaction of phototherapy, where words are superfluous, and light speaks. We tuneinto your emotions, crafting a unique therapeutic ambiance through emotion computation. Here, health is not justmonitored; it's cherished and nurtured. Let LjUs guide you into the warmth of llumination, embracing your true
                        self.
                    </p>
                    <div className="btn" onClick={() => navigate(process.env.PUBLIC_URL + '/miniprogram')}>
                        START JOURNEY
                    </div>
                </section>

                <section>
                    <img src="/assets/rl/Frame 329.png" alt="" />
                    <p className="centered-paragraph">
                        The project on Smoothed Q-Learning and Smoothed Deep Q-Networks (SDQNs) advanced reinforcement learning by incorporating statistical smoothing techniques, enhancing policy robustness in complex environments. By integrating deep learning and probabilistic confidence measures, these methods demonstrated improved decision-making stability and adaptability to environmental uncertainties.
                    </p>
                    <div className="btn" onClick={() => navigate(process.env.PUBLIC_URL + '/rl')}>
                        START JOURNEY
                    </div>
                </section>

                <section>
                    <img src="/assets/exerciseApp/Exercise Web App.png" alt="" />
                    <p className="centered-paragraph">The UCL Exercises Web Application redefines physiotherapy management by providing a centralized, interactive platform for personalized rehabilitation exercises and clinician-crafted treatment plans. Bridging technology and healthcare, it offers seamless access and tailored user experiences to improve recovery outcomes and clinician efficiency.</p>
                    <div className="btn" onClick={() => navigate(process.env.PUBLIC_URL + '/exerciseapp')}>
                        START JOURNEY
                    </div>
                </section>

                {/*<section>*/}
                {/*    <img src="/assets/LjUs/Behaviour 1.png" alt="" />*/}
                {/*    <p>Reinforcement Learning</p>*/}
                {/*    <div className="btn">*/}
                {/*        START JOURNEY*/}
                {/*    </div>*/}
                {/*</section>*/}

                <div className="footer">
                    <img src="/assets/kn.png" alt="" onClick={toTop} />
                    <p>Copyright © Xingrui GU. All Rights Reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default Home;
