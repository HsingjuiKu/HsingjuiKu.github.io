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
                <div className="logo"><a href="/"><img src="/assets/logo.png" alt="" /></a></div>
                {/*<div className="about"><p>About</p></div>*/}
                {/*<div className="banner">*/}
                {/*    <video src="/assets/about.mp4" muted autoPlay loop style={{ width: '100%' }}></video>*/}
                {/*</div>*/}
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

                {/*<section className="flex-row">*/}
                {/*    <div className="left" style={{ width: '30%', display: 'flex', flexDirection: 'column' }}>*/}
                {/*        <img src="/assets/WechatIMG371.jpeg" alt="" />*/}
                {/*    </div>*/}
                {/*    <div className="right" style={{ width: '70%', display: 'flex', flexDirection: 'column' }}>*/}
                {/*        <p class="centered">*/}
                {/*            Hi, I'm Xingrui Gu. I'm deeply passionate about exploring the intricacies of the human mind and its interaction with technology. My research primarily focuses on Human Intuitive Reasoning, especially in Causal and Bayesian Reasoning, which allows us to understand how people make sense of the world around them through mathematical language. I'm also highly interested in Human Centered Computing, Affective Computing, Reinforcement Learning and Human-Computer Interaction, areas where I aim to further contribute by developing more intuitive and effective AI technology interfaces.*/}
                {/*        </p><br/>*/}
                {/*        /!*<p class="centered"><a href={"https://drive.google.com/file/d/1W6tw4YMhG_84DD-N6O8BCIsl0FdW228B/view?usp=sharing"}>R E S U M E</a></p>*!/*/}
                {/*        /!*<p class="centered"></p>*!/*/}
                {/*    </div>*/}

                {/*</section>*/}


                <section style={{
                    padding: '6rem 0',
                    background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* 背景装饰 */}
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '0',
                        width: '100%',
                        height: '50%',
                        background: 'linear-gradient(to bottom right, rgba(238, 238, 238, 0.5), rgba(245, 245, 245, 0.5))',
                        transform: 'skewY(-6deg)',
                        zIndex: 0
                    }}/>

                    <div style={{
                        maxWidth: '1200px',
                        margin: '0 auto',
                        padding: '0 2rem',
                        position: 'relative',
                        zIndex: 1
                    }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1.2fr',
                            gap: '4rem',
                            alignItems: 'center'
                        }}>
                            {/* 左侧图片容器 */}
                            <div style={{
                                position: 'relative',
                                padding: '1rem',
                                background: 'white',
                                borderRadius: '20px',
                                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                                transform: 'rotate(-2deg)'
                            }}>
                                <img
                                    src="/assets/WechatIMG371.jpeg"
                                    alt="Profile"
                                    style={{
                                        width: '100%',
                                        borderRadius: '12px',
                                        filter: 'grayscale(100%)',
                                        transition: 'transform 0.3s ease',
                                        transform: 'rotate(2deg)'
                                    }}
                                />
                            </div>

                            {/* 右侧文字内容 */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2rem'
                            }}>
                                <div>
                                    <h4 style={{
                                        fontSize: '1.1rem',
                                        color: '#6c757d',
                                        marginBottom: '0.5rem',
                                        fontWeight: '500',
                                        letterSpacing: '2px'
                                    }}>
                                        WELCOME TO MY WEBSITE
                                    </h4>
                                    <h1 style={{
                                        fontSize: '3.5rem',
                                        fontWeight: '700',
                                        background: 'linear-gradient(45deg, #333, #666)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        marginBottom: '2rem'
                                    }}>
                                        Hi, I'm Xingrui Gu
                                    </h1>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1.5rem'
                                }}>
                                    <p style={{
                                        fontSize: '1.1rem',
                                        lineHeight: '1.8',
                                        color: '#495057'
                                    }}>
                                        I'm deeply passionate about exploring the intricacies of the human mind and its interaction with technology. My research primarily focuses on Human Intuitive Reasoning, especially in Causal and Bayesian Reasoning, which allows us to understand how people make sense of the world around them through mathematical language.
                                    </p>
                                    <p style={{
                                        fontSize: '1.1rem',
                                        lineHeight: '1.8',
                                        color: '#495057'
                                    }}>
                                        I'm also highly interested in Human Centered Computing, Affective Computing, Reinforcement Learning and Human-Computer Interaction, areas where I aim to further contribute by developing more intuitive and effective AI technology interfaces.
                                    </p>
                                </div>

                                {/* 技术关键词标签 */}
                                <div style={{
                                    display: 'flex',
                                    gap: '0.8rem',
                                    flexWrap: 'wrap',
                                    marginTop: '1rem'
                                }}>
                                    {['HCI', 'AI', 'Cognitive Science', 'Machine Learning'].map(tag => (
                                        <span key={tag} style={{
                                            padding: '0.5rem 1rem',
                                            background: '#f8f9fa',
                                            borderRadius: '50px',
                                            fontSize: '0.9rem',
                                            color: '#495057',
                                            border: '1px solid #dee2e6'
                                        }}>
                            {tag}
                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>


                <div className="section">
                    <div className="section-header">
                        <h2>Education</h2>
                    </div>

                    <div className="entry">
                        <div className="entry-dates">2019 - 2022</div>
                        <div className="entry-org">
                            <img
                                src="/assets/a1.webp"
                                alt="KCL Logo"
                                style={{ height: '20px', verticalAlign: 'middle', marginRight: '8px' }}
                            />
                            King’s College London — BSc Mathematics with Statistics
                        </div>
                    </div>

                    <div className="entry">
                        <div className="entry-dates">2022 - 2023</div>
                        <div className="entry-org">
                            <img
                                src="/assets/a2.png"
                                alt="UCL Logo"
                                style={{ height: '20px', verticalAlign: 'middle', marginRight: '8px' }}
                            />
                            University College London — MSc Computer Science
                        </div>
                    </div>

                    <div className="entry">
                        <div className="entry-dates">2023 - Present</div>
                        <div className="entry-org">
                            <img
                                src="/assets/a3.png"
                                alt="UCB Logo"
                                style={{ height: '20px', verticalAlign: 'middle', marginRight: '8px' }}
                            />
                            University of California, Berkeley — MEng Electrical Engineering and Computer Science
                        </div>
                    </div>
                </div>



                <section className="flex-row">
                    <div className="left" style={{ width: '50%' }}>
                        <h2>In Brief</h2>
                    </div>
                    <div className="right brief" style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
                        <p><i className="bold">2020.08 - 2020.12</i></p>
                        <p>China Automotive Technology and Research Center Co. Ltd</p>
                        <p><i className="bold">2021.07 - 2021.09</i></p>
                        <p>Institute of Radiological Medicine, Chinese Academy of Medical Sciences</p>
                        <p><i className="bold">2021.12 - 2024.03</i></p>
                        <p>LJÜS LIGHTEN US LTD</p>
                        <p><i className="bold">2022.07 - 2022.08</i></p>
                        <p>International Innovative Practice Summer Camp, Shanghai Jiao Tong University</p>
                        <p><i className="bold">2022.09 - 2023.01</i></p>
                        <p>Stanford E-China, Stanford University</p>
                        <p><i className="bold">2021.09 - 2021.11 & 2023.05 - 2023.09</i></p>
                        <p>Institute for Al Industry Research, Tsinghua University</p>
                        <p><i className="bold">2023.05 - 2023.10</i></p>
                        <p>Centre for Artificial Intelligence, UCL</p>
                        <p><i className="bold">2023.06 - 2023.08</i></p>
                        <p>Microsoft</p>
                        <p><i className="bold">2023.10 - 2024.06</i></p>
                        <p>The Future Laboratory, Tsinghua University</p>
                        <p><i className="bold">2024.06 - 2024.08</i></p>
                        <p>INNO Angel Fund</p>
                    </div>

                </section>

                <section className="flex-row">
                    <div className="left">
                        <h2>Publication</h2>
                    </div>
                    <div className="right brief" style={{ width: '70%', display: 'flex', flexDirection: 'column' }}>

                        <p><i className="bold"><a href={"https://arxiv.org/abs/2404.00320"}> Advancing Multimodal Data Fusion in Pain Recognition: A Strategy Leveraging Statistical Correlation and Human-Centered Perspectives</a></i></p>
                        <p>(Submitted journal: ACII AHRI Workshop; Status: Accepted)</p>
                        <p><i className="bold"> <a href={"https://arxiv.org/abs/2409.15564"}>CauSkelNet: Causal Representation Learning for Human Behaviour Analysis</a> </i></p>
                        <p>(Submitted journal: IEEE Automatic Face and Gesture Recognition; Status: Accepted)</p>
                        <p><i className="bold"> Cognitive Belief Driven Reinforcement Learning</i></p>
                        <p>(Submitted journal: ICML; Status: Under View)</p>


                    </div>

                </section>


                <section className="flex-row">
                    <div className="left">
                        <h2>Honors</h2>
                    </div>
                    <div className="right " style={{ width: '70%', display: 'flex', flexDirection: 'column' }}>
                        {/*<p>● Received an investment intention of 1.5 million RMB, 2023</p>*/}
                        <p>● "Chunhui Cup"lnnovation and Entrepreneurship Competition for Chinese OverseasStudents, Award-winning Project, 2023</p>
                        {/*<p>● "Straight to Wuzhen" competition, Final list, 2023</p>*/}
                        {/*<p>● UCL Hatchery Incubator, Semi-Final list, 2023</p>*/}
                        {/*<p>● "To win in Suthou, Create a winning future" venture contest, Sweden Final list, 2022</p>*/}
                        <p>● KCL Opportunity Fund, GBP 400 pounds, 2022</p>
                        {/*<p>● The KTH Innovation pre-incubator program, Final list, 2022</p>*/}
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