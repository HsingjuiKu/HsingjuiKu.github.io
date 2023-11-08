import React from "react";
import { useEffect, useRef } from "react";
import "./about.scss"

const About = () => {
    const toTop=()=>{
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    const textRef = useRef(null);
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('immersive-text-visible');
                } else {
                    entry.target.classList.remove('immersive-text-visible');
                }
            },
            {
                threshold: 0.1 // Trigger when at least 10% of the element is in the viewport
            }
        );

        if (textRef.current) {
            observer.observe(textRef.current);
        }

        return () => {
            if (textRef.current) {
                observer.unobserve(textRef.current);
            }
        };
    }, []);

    return (
        <div className="about">
            <div className="aboutContainer">
            <div className="logo"><a href="/home"><img src="/assets/logo.png" alt="" /></a></div>
                {/*<div className="about"><p>About</p></div>*/}
                <div className="banner">
                    <video src="/assets/about.mp4" muted autoPlay loop style={{ width: '100%' }}></video>
                </div>
                <br/>
                <br/>
                <br/>
                <br/>
                <br/>
                <section className="immersive-section">
                    <p ref={textRef} style={{ fontWeight: 'bold', fontSize: '30px' }}>
                        My Story
                    </p>

                    <p ref={textRef} className="immersive-text">
                        In silence, I came to be, where melodies and secrets turned to silent regrets within me. My deafness once isolated me, stirring tempests within and solitude around. But as I sought healing, I found myself in the mesmerizing fields of cognitive science and emotional computation. In the quiet, my search for sound mirrored a night's quest for starlight. Data science opened new worlds to me, and AI, along with interactive technology, fused numbers, sound, and feeling. My affinity for technology was more than passion—it was a dream of a world alive with sound and sentiment. The advent of hearing aids illuminated my life, revealing that technology bridges more than data and sound—it connects us at the soul, pulling me into the cosmic dance.
                    </p>
                </section>

                <section className="flex-row">
                    <div className="left" style={{ width: '30%', display: 'flex', flexDirection: 'column' }}>
                        <img src="/assets/WechatIMG371.jpeg" alt="" />
                    </div>
                    <div className="right" style={{ width: '70%', display: 'flex', flexDirection: 'column' }}>
                        <p class="centered">
                            Hi, I'm Xingrui Gu, a Creative AI Interaction Engineer, Data Scientist and Designer. <br/>
                            Nice to meet you!
                            {/*I'm driven by the ethos of human-centric Al. In that spirit,l am dedicatedto working within the domain of intelligent systems, with an aim toestablish reliable Al models that can be subsequently tailored intotechnological products that cater to specific user needs. <br /><br />*/}
                            {/*completed my studies under the tutelage of Professor <a href="https://davidbarber.github.io/" target="_blank">David Barber</a> at UCL, with a strong focus on reinforcement learning and machinelearning.Additionally, I was privileged to receive guidance fromProfessor Nadia Berthouze, a pioneer in the field of emotionalcomputing.<br /><br />*/}
                            {/*Beyond the professional sphere, l have a passion for writingtraveling, photography, painting, and devising new stock marketstrategies.I have a profound interest in technological innovationstailored for the deaf-mute community and those with psychologicaimpairments.I'm always open to engaging discussions in this area, sofeel free to reach out.<br /><br />*/}
                        </p><br/>
                        <p class="centered"><a href={"https://davidbarber.github.io/"}>R E S U M E</a></p>
                    </div>

                </section>

                <section className="flex-row">
                    <div className="left" style={{ width: '50%' }}>
                        <h2>Academic Journey</h2>
                        
                    </div>
                    <div className="right" style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
                        <div className="a-item">
                            <img src="/assets/a1.webp" alt="" />
                            <span><span className="bold">2019 - 2022</span><br/>
                                <span>BSc Mathematics with Statistics, King's College London</span></span>
                        </div>

                        <div className="a-item">
                            <img src="/assets/a2.png" alt="" />
                            <span><span className="bold">2022 - 2023</span><br/>
                                <span>MSc Computer Science, University College London</span></span>
                        </div>
                    </div>

                </section>


                <section className="flex-row">
                    <div className="left" style={{ width: '50%' }}>
                        <h2>In Brief</h2>
                    </div>
                    <div className="right brief" style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
                        <p><i className="bold">2020.08 - 2020.12</i></p>
                        <p>China Automotive Technology and Research Center Co. Ltd</p>
                        <p><i className="bold">2021.07 - 2021.09</i></p>
                        <p>Institute of Radiological Medicine, Chinese Academy of Medical Sciences</p>
                        <p><i className="bold">2021.12 - Present</i></p>
                        <p>LJÜS LIGHTEN US LTD</p>
                        <p><i className="bold">2021.09 - 2021.11 & 2023.05 - 2023.09</i></p>
                        <p>Institute for Al Industry Research, Tsinghua University</p>
                        <p><i className="bold">2023.05 - 2023.10</i></p>
                        <p>Centre for Artificial Intelligence, UCL</p>
                        <p><i className="bold">2023.10 - Present</i></p>
                        <p>The Future Laboratory, Tsinghua University</p>
                    </div>

                </section>

                <section className="flex-row">
                    <div className="left">
                        <h2>Publication</h2>
                    </div>
                    <div className="right brief" style={{ width: '70%', display: 'flex', flexDirection: 'column' }}>
                        <p><i className="bold">How do end users without Al knowledge perceive Al's decision-making: An empirical study on online crowd.
                            sourcing medical consultation platforms.</i></p>
                        <p>(Submitted journal: CHI24; Status: Double-anonymous under review)</p>
                        <p><i className="bold">What Makes a Fantastic Passenger-Car Driver in Urban Contexts?</i></p>
                        <p>(Submitted journal: CHI24; Status: Double-anonymous under review)</p>
                        <p><i className="bold">Deep Reinforcement Learning with Smoothed Q-Learning</i></p>
                        <p>(Status: master thesis-await to be publish)</p>

                    </div>

                </section>


                <section className="flex-row">
                    <div className="left">
                        <h2>Honors</h2>
                    </div>
                    <div className="right " style={{ width: '70%', display: 'flex', flexDirection: 'column' }}>
                        <p>● "Chunhui Cup"lnnovation and Entrepreneurship Competition for Chinese OverseasStudents, Award-winning Project, 2023</p>
                        <p>● "Straight to Wuzhen" competition, Final list, 2023</p>
                        <p>● UCL Hatchery Incubator, Semi-Final list, 2023</p>
                        <p>● "To win in Suthou, Create a winning future" venture contest, Sweden Final list, 2022</p>
                        <p>● KCL Opportunity Fund, E400, 2022</p>
                        <p>● The KTH Innovation pre-incubator program, Final list, 2022</p>
                    </div>

                </section>

                <section className="flex-row">
                    <div className="left" >
                        <h2>Contact</h2>
                    </div>
                    <div className="right " style={{ width: '70%', display: 'flex', flexDirection: 'column' }}>
                        <div className="b-item">
                            <img src="/assets/Vector2.png" alt="" />
                            <i><span className="bold">Email: x.gu.hayden@gmail.com</span></i>
                        </div>

                        <div className="b-item">
                            <img src="/assets/Vector1.png" alt="" />
                            <i><span className="bold">Ins: grxprc98</span></i>
                        </div>

                        <div className="b-item">
                            <img src="/assets/Vector.png" alt="" />
                            <i><span className="bold">Linkedln:  <a href="https://www.linkedin.com/in/xingrui-gu-1b22b0236/" target="_blank"> Xingrui Gu </a></span></i>
                        </div>

                    </div>

                </section>




                <div className="footer">
                    <img src="/assets/kn.png" alt="" onClick={toTop}/>
                    <p>Copyright © Xingrui GU. All Rights Reserved.</p>

                </div>

            </div>
        </div>
    );

};

export default About
