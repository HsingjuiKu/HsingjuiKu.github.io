import React from "react";
import "./home.scss";
import {useHistory} from 'react-router-dom'

// Home component
const Home = () => {
    const toTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
    let history = useHistory()
    return (
        <div className="home">
            <div className="homeContainer">
                <div className="logo"><a href="/home"><img src="/assets/logo.png" alt="" /></a></div>
                <div className="banner">
                    <video src="/assets/home.mp4" muted autoPlay loop style={{ width: '100%' }}></video>
                </div>
                <section>
                    <h2 className="h-t">X.GU</h2>
                    {/*<p className="h-p">A romantic AI Interaction Engineer,Data Scientist in addition to being an artist and poet</p>*/}
                    <br/>
                    <br/>
                    <div className="btns">
                        <div className="btn" onClick={() => history.push('/about')}>
                            ABOUT ME
                        </div>
                        <div className="btn" onClick={() => { window.location.href = "https://github.com/HsingjuiKu" }}>
                            GITHUB
                        </div>
                        <div className="btn" onClick={() => { window.location.href = "/#" }}>
                            RESUME
                        </div>
                    </div>
                </section>

                <section>
                    <img src="/assets/MoodClip/MoonClip1.jpg" alt="" />
                    <p className="centered-paragraph">
                        Drawing inspiration from the artistry of vintage photographs, we delve into the intricate tapestry of facial emotion recognition. With a keen focus on elevating the mental and physical well-being of the elderly, Behavior crafts a meticulously designed UX canvas. A seamless interface that transcends age, uniting past aesthetics with future technologies, to resonate deeply and heal holistically.
                    </p>
                    <div className="btn" onClick={() => { window.location.href = "/moodClip" }}>
                        START JOURNEY
                    </div>
                </section>


                <section>
                    <img src="/assets/LjUs Poster.png" alt="" />
                    <p className="centered-paragraph">Experience the profound interaction of phototherapy, where words are superfluous, and light speaks. We tune into your emotions, crafting a unique therapeutic ambiance through emotion computation. Here, health is not just monitored; it's cherished and nurtured. Let LjUs guide you into the warmth of illumination, embracing your true self.</p>
                    {/*<p>Experience the profound interaction of phototherapy, where words are superfluous, and light speaks. We tuneinto your emotions, crafting a unique therapeutic ambiance through emotion computation. Here, health is not justmonitored; it's cherished and nurtured. Let LjUs guide you into the warmth of illumination, embracing your trueself.</p>*/}
                    <div className="btn" onClick={() => { window.location.href = "/ljus" }}>
                        START JOURNEY
                    </div>
                </section>

                <section>
                    <img src="/assets/miniprogram/MiniProgram Poster.png" alt="" />
                    <p className="centered-paragraph">Experience the profound interaction of phototherapy, where words are superfluous, and light speaks. We tuneinto your emotions, crafting a unique therapeutic ambiance through emotion computation. Here, health is not justmonitored; it's cherished and nurtured. Let LjUs guide you into the warmth of llumination, embracing your true
                        self.
                    </p>
                    <div className="btn" onClick={() => { window.location.href = "/miniprogram" }}>
                        START JOURNEY
                    </div>
                </section>

                <section>
                    <img src="/assets/rl/Frame 329.png" alt="" />
                    <p className="centered-paragraph">
                        The project on Smoothed Q-Learning and Smoothed Deep Q-Networks (SDQNs) advanced reinforcement learning by incorporating statistical smoothing techniques, enhancing policy robustness in complex environments. By integrating deep learning and probabilistic confidence measures, these methods demonstrated improved decision-making stability and adaptability to environmental uncertainties.
                    </p>
                    <div className="btn" onClick={() => { window.location.href = "/rl" }}>
                        START JOURNEY
                    </div>
                </section>

                <section>
                    <img src="/assets/exerciseApp/Exercise Web App.png" alt="" />
                    <p className="centered-paragraph">The UCL Exercises Web Application redefines physiotherapy management by providing a centralized, interactive platform for personalized rehabilitation exercises and clinician-crafted treatment plans. Bridging technology and healthcare, it offers seamless access and tailored user experiences to improve recovery outcomes and clinician efficiency.</p>
                    <div className="btn" onClick={() => { window.location.href = "/exerciseapp" }}>
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
