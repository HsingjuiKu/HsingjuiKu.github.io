// import React from "react";
// import { useEffect, useRef } from "react";
// import "./about.scss"
//
// const About = () => {
//     const toTop=()=>{
//         window.scrollTo({
//             top: 0,
//             behavior: "smooth"
//         });
//     }
//
//     const textRef = useRef(null);
//     useEffect(() => {
//         const observer = new IntersectionObserver(
//             ([entry]) => {
//                 if (entry.isIntersecting) {
//                     entry.target.classList.add('immersive-text-visible');
//                 } else {
//                     entry.target.classList.remove('immersive-text-visible');
//                 }
//             },
//             {
//                 threshold: 0.1 // Trigger when at least 10% of the element is in the viewport
//             }
//         );
//
//         if (textRef.current) {
//             observer.observe(textRef.current);
//         }
//
//         return () => {
//             if (textRef.current) {
//                 observer.unobserve(textRef.current);
//             }
//         };
//     }, []);
//
//     return (
//         <div className="about">
//             <div className="aboutContainer">
//             <div className="logo"><a href="/"><img src="/assets/logo.png" alt="" /></a></div>
//                 {/*<div className="about"><p>About</p></div>*/}
//                 {/*<div className="banner">*/}
//                 {/*    <video src="/assets/about.mp4" muted autoPlay loop style={{ width: '100%' }}></video>*/}
//                 {/*</div>*/}
//                 <br/>
//                 <br/>
//                 <br/>
//                 <br/>
//                 <br/>
//                 <section className="immersive-section">
//                     <p ref={textRef} style={{ fontWeight: 'bold', fontSize: '30px' }}>
//                         My Story
//                     </p>
//
//                     <p ref={textRef} className="immersive-text">
//                         In silence, I came to be, where melodies and secrets turned to silent regrets within me. My deafness once isolated me, stirring tempests within and solitude around. But as I sought healing, I found myself in the mesmerizing fields of cognitive science and emotional computation. In the quiet, my search for sound mirrored a night's quest for starlight. Data science opened new worlds to me, and AI, along with interactive technology, fused numbers, sound, and feeling. My affinity for technology was more than passion—it was a dream of a world alive with sound and sentiment. The advent of hearing aids illuminated my life, revealing that technology bridges more than data and sound—it connects us at the soul, pulling me into the cosmic dance.
//                     </p>
//                 </section>
//
//                 {/*<section className="flex-row">*/}
//                 {/*    <div className="left" style={{ width: '30%', display: 'flex', flexDirection: 'column' }}>*/}
//                 {/*        <img src="/assets/WechatIMG371.jpeg" alt="" />*/}
//                 {/*    </div>*/}
//                 {/*    <div className="right" style={{ width: '70%', display: 'flex', flexDirection: 'column' }}>*/}
//                 {/*        <p class="centered">*/}
//                 {/*            Hi, I'm Xingrui Gu. I'm deeply passionate about exploring the intricacies of the human mind and its interaction with technology. My research primarily focuses on Human Intuitive Reasoning, especially in Causal and Bayesian Reasoning, which allows us to understand how people make sense of the world around them through mathematical language. I'm also highly interested in Human Centered Computing, Affective Computing, Reinforcement Learning and Human-Computer Interaction, areas where I aim to further contribute by developing more intuitive and effective AI technology interfaces.*/}
//                 {/*        </p><br/>*/}
//                 {/*        /!*<p class="centered"><a href={"https://drive.google.com/file/d/1W6tw4YMhG_84DD-N6O8BCIsl0FdW228B/view?usp=sharing"}>R E S U M E</a></p>*!/*/}
//                 {/*        /!*<p class="centered"></p>*!/*/}
//                 {/*    </div>*/}
//
//                 {/*</section>*/}
//
//
//                 <section style={{
//                     padding: '6rem 0',
//                     background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)',
//                     position: 'relative',
//                     overflow: 'hidden'
//                 }}>
//                     {/* 背景装饰 */}
//                     <div style={{
//                         position: 'absolute',
//                         top: '50%',
//                         left: '0',
//                         width: '100%',
//                         height: '50%',
//                         background: 'linear-gradient(to bottom right, rgba(238, 238, 238, 0.5), rgba(245, 245, 245, 0.5))',
//                         transform: 'skewY(-6deg)',
//                         zIndex: 0
//                     }}/>
//
//                     <div style={{
//                         maxWidth: '1200px',
//                         margin: '0 auto',
//                         padding: '0 2rem',
//                         position: 'relative',
//                         zIndex: 1
//                     }}>
//                         <div style={{
//                             display: 'grid',
//                             gridTemplateColumns: '1fr 1.2fr',
//                             gap: '4rem',
//                             alignItems: 'center'
//                         }}>
//                             {/* 左侧图片容器 */}
//                             <div style={{
//                                 position: 'relative',
//                                 padding: '1rem',
//                                 background: 'white',
//                                 borderRadius: '20px',
//                                 boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
//                                 transform: 'rotate(-2deg)'
//                             }}>
//                                 <img
//                                     src="/assets/WechatIMG371.jpeg"
//                                     alt="Profile"
//                                     style={{
//                                         width: '100%',
//                                         borderRadius: '12px',
//                                         filter: 'grayscale(100%)',
//                                         transition: 'transform 0.3s ease',
//                                         transform: 'rotate(2deg)'
//                                     }}
//                                 />
//                             </div>
//
//                             {/* 右侧文字内容 */}
//                             <div style={{
//                                 display: 'flex',
//                                 flexDirection: 'column',
//                                 gap: '2rem'
//                             }}>
//                                 <div>
//                                     <h4 style={{
//                                         fontSize: '1.1rem',
//                                         color: '#6c757d',
//                                         marginBottom: '0.5rem',
//                                         fontWeight: '500',
//                                         letterSpacing: '2px'
//                                     }}>
//                                         WELCOME TO MY WEBSITE
//                                     </h4>
//                                     <h1 style={{
//                                         fontSize: '3.5rem',
//                                         fontWeight: '700',
//                                         background: 'linear-gradient(45deg, #333, #666)',
//                                         WebkitBackgroundClip: 'text',
//                                         WebkitTextFillColor: 'transparent',
//                                         marginBottom: '2rem'
//                                     }}>
//                                         Hi, I'm Xingrui Gu
//                                     </h1>
//                                 </div>
//
//                                 <div style={{
//                                     display: 'flex',
//                                     flexDirection: 'column',
//                                     gap: '1.5rem'
//                                 }}>
//                                     <p style={{
//                                         fontSize: '1.1rem',
//                                         lineHeight: '1.8',
//                                         color: '#495057'
//                                     }}>
//                                         I'm deeply passionate about exploring the intricacies of the human mind and its interaction with technology. My research primarily focuses on Human Intuitive Reasoning, especially in Causal and Bayesian Reasoning, which allows us to understand how people make sense of the world around them through mathematical language.
//                                     </p>
//                                     <p style={{
//                                         fontSize: '1.1rem',
//                                         lineHeight: '1.8',
//                                         color: '#495057'
//                                     }}>
//                                         I'm also highly interested in Human Centered Computing, Affective Computing, Reinforcement Learning and Human-Computer Interaction, areas where I aim to further contribute by developing more intuitive and effective AI technology interfaces.
//                                     </p>
//                                 </div>
//
//                                 {/* 技术关键词标签 */}
//                                 <div style={{
//                                     display: 'flex',
//                                     gap: '0.8rem',
//                                     flexWrap: 'wrap',
//                                     marginTop: '1rem'
//                                 }}>
//                                     {['HCI', 'AI', 'Cognitive Science', 'Machine Learning'].map(tag => (
//                                         <span key={tag} style={{
//                                             padding: '0.5rem 1rem',
//                                             background: '#f8f9fa',
//                                             borderRadius: '50px',
//                                             fontSize: '0.9rem',
//                                             color: '#495057',
//                                             border: '1px solid #dee2e6'
//                                         }}>
//                             {tag}
//                         </span>
//                                     ))}
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </section>
//
//
//                 <section className="flex-row">
//                     <div className="left" style={{ width: '50%' }}>
//                         <h2>In Brief</h2>
//                     </div>
//                     <div className="right brief" style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
//                         <p><i className="bold">2020.08 - 2020.12</i></p>
//                         <p>China Automotive Technology and Research Center Co. Ltd</p>
//                         <p><i className="bold">2021.07 - 2021.09</i></p>
//                         <p>Institute of Radiological Medicine, Chinese Academy of Medical Sciences</p>
//                         <p><i className="bold">2021.12 - 2024.03</i></p>
//                         <p>LJÜS LIGHTEN US LTD</p>
//                         <p><i className="bold">2022.07 - 2022.08</i></p>
//                         <p>International Innovative Practice Summer Camp, Shanghai Jiao Tong University</p>
//                         <p><i className="bold">2022.09 - 2023.01</i></p>
//                         <p>Stanford E-China, Stanford University</p>
//                         <p><i className="bold">2021.09 - 2021.11 & 2023.05 - 2023.09</i></p>
//                         <p>Institute for Al Industry Research, Tsinghua University</p>
//                         <p><i className="bold">2023.05 - 2023.10</i></p>
//                         <p>Centre for Artificial Intelligence, UCL</p>
//                         <p><i className="bold">2023.10 - 2024.06</i></p>
//                         <p><i className="bold">2024.06 - 2024.08</i></p>
//                         <p>Microsoft</p>
//                         <p>The Future Laboratory, Tsinghua University</p>
//                         <p><i className="bold">2024.06 - 2024.08</i></p>
//                         <p>INNO Angel Fund</p>
//                     </div>
//
//                 </section>
//
//                 <section className="flex-row">
//                     <div className="left">
//                         <h2>Publication</h2>
//                     </div>
//                     <div className="right brief" style={{ width: '70%', display: 'flex', flexDirection: 'column' }}>
//
//                         <p><i className="bold"><a href={"https://arxiv.org/abs/2404.00320"}> Advancing Multimodal Data Fusion in Pain Recognition: A Strategy Leveraging Statistical Correlation and Human-Centered Perspectives</a></i></p>
//                         <p>(Submitted journal: ACII AHRI Workshop; Status: Accepted)</p>
//                         <p><i className="bold"> <a href={"https://arxiv.org/abs/2409.15564"}>CauSkelNet: Causal Representation Learning for Human Behaviour Analysis</a> </i></p>
//                         <p>(Submitted journal: IEEE Automatic Face and Gesture Recognition; Status: Accepted)</p>
//                         <p><i className="bold"> Cognitive Belief Driven Reinforcement Learning</i></p>
//                         <p>(Submitted journal: ICML; Status: Under View)</p>
//
//
//                     </div>
//
//                 </section>
//
//
//                 <section className="flex-row">
//                     <div className="left">
//                         <h2>Honors</h2>
//                     </div>
//                     <div className="right " style={{ width: '70%', display: 'flex', flexDirection: 'column' }}>
//                         <p>● Received an investment intention of 1.5 million RMB, 2023</p>
//                         <p>● "Chunhui Cup"lnnovation and Entrepreneurship Competition for Chinese OverseasStudents, Award-winning Project, 2023</p>
//                         <p>● "Straight to Wuzhen" competition, Final list, 2023</p>
//                         <p>● UCL Hatchery Incubator, Semi-Final list, 2023</p>
//                         <p>● "To win in Suthou, Create a winning future" venture contest, Sweden Final list, 2022</p>
//                         <p>● KCL Opportunity Fund, GBP 400 pounds, 2022</p>
//                         <p>● The KTH Innovation pre-incubator program, Final list, 2022</p>
//                     </div>
//
//                 </section>
//
//                 <section className="flex-row">
//                     <div className="left" >
//                         <h2>Contact</h2>
//                     </div>
//                     <div className="right " style={{ width: '70%', display: 'flex', flexDirection: 'column' }}>
//                         <div className="b-item">
//                             <img src="/assets/Vector2.png" alt="" />
//                             <i><span className="bold">Email: x.gu.hayden@gmail.com</span></i>
//                         </div>
//
//                         <div className="b-item">
//                             <img src="/assets/Vector1.png" alt="" />
//                             <i><span className="bold">Ins: grxprc98</span></i>
//                         </div>
//
//                         <div className="b-item">
//                             <img src="/assets/Vector.png" alt="" />
//                             <i><span className="bold">Linkedln:  <a href="https://www.linkedin.com/in/xingrui-gu-1b22b0236/" target="_blank"> Xingrui Gu </a></span></i>
//                         </div>
//
//                     </div>
//
//                 </section>
//
//
//
//
//                 <div className="footer">
//                     <img src="/assets/kn.png" alt="" onClick={toTop}/>
//                     <p>Copyright © Xingrui GU. All Rights Reserved.</p>
//
//                 </div>
//
//             </div>
//         </div>
//     );
//
// };
//
// export default About


import React, { useEffect, useRef, useState } from "react";
import "./about.scss";

const About = () => {
    const [scrollPosition, setScrollPosition] = useState(0);
    const storyRef = useRef(null);
    const profileRef = useRef(null);
    const briefRef = useRef(null);
    const publicationRef = useRef(null);
    const honorsRef = useRef(null);
    const contactRef = useRef(null);

    // Scroll to top function
    const toTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    // Handle scroll events for parallax and animation effects
    useEffect(() => {
        const handleScroll = () => {
            setScrollPosition(window.scrollY);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Intersection Observer for fade-in animations
    useEffect(() => {
        const options = {
            threshold: 0.1,
            rootMargin: "0px 0px -100px 0px"
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-visible');
                }
            });
        }, options);

        const elements = [
            storyRef.current,
            profileRef.current,
            briefRef.current,
            publicationRef.current,
            honorsRef.current,
            contactRef.current
        ];

        elements.forEach(el => {
            if (el) observer.observe(el);
        });

        return () => {
            elements.forEach(el => {
                if (el) observer.unobserve(el);
            });
        };
    }, []);

    return (
        <div className="about">
            {/* Navigation */}
            <header style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                padding: '20px 40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backdropFilter: 'blur(10px)',
                backgroundColor: `rgba(255, 255, 255, ${Math.min(scrollPosition / 300, 0.9)})`,
                zIndex: 100,
                transition: 'all 0.3s ease',
                boxShadow: scrollPosition > 50 ? '0 1px 20px rgba(0,0,0,0.05)' : 'none'
            }}>
                <div className="logo">
                    <a href="/">
                        <img src="/assets/logo.png" alt="Xingrui Gu"
                             style={{ height: '36px', opacity: 0.9 }} />
                    </a>
                </div>
                <nav style={{
                    display: 'flex',
                    gap: '30px'
                }}>
                    <a href="#story" style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}>Story</a>
                    <a href="#profile" style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}>Profile</a>
                    <a href="#experience" style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}>Experience</a>
                    <a href="#research" style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}>Research</a>
                    <a href="#contact" style={{ textDecoration: 'none', color: '#333', fontSize: '16px' }}>Contact</a>
                </nav>
            </header>

            <div className="aboutContainer">
                {/* Hero Section */}
                <section className="hero" style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    padding: '0 20px',
                    background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)',
                    position: 'relative'
                }}>
                    <h1 style={{
                        fontSize: '72px',
                        fontWeight: '700',
                        marginBottom: '20px',
                        letterSpacing: '-1px',
                        background: 'linear-gradient(135deg, #000000, #444444)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Xingrui Gu
                    </h1>
                    <p style={{
                        fontSize: '24px',
                        maxWidth: '700px',
                        lineHeight: '1.5',
                        color: '#555',
                        marginBottom: '40px'
                    }}>
                        Exploring the intersection of human cognition and artificial intelligence
                    </p>

                    <div style={{
                        display: 'flex',
                        gap: '16px'
                    }}>
                        <a href="#profile" style={{
                            padding: '12px 28px',
                            background: '#000',
                            color: '#fff',
                            borderRadius: '30px',
                            fontSize: '17px',
                            textDecoration: 'none',
                            fontWeight: '500',
                            transition: 'all 0.3s ease'
                        }}>
                            Learn more
                        </a>
                        <a href="#contact" style={{
                            padding: '12px 28px',
                            background: 'transparent',
                            color: '#000',
                            borderRadius: '30px',
                            fontSize: '17px',
                            textDecoration: 'none',
                            fontWeight: '500',
                            border: '1px solid #000',
                            transition: 'all 0.3s ease'
                        }}>
                            Contact me
                        </a>
                    </div>

                    <div style={{
                        position: 'absolute',
                        bottom: '40px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        animation: 'bounce 2s infinite'
                    }}>
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M19 12l-7 7-7-7"/>
                        </svg>
                    </div>
                </section>

                {/* Story Section */}
                <section id="story" ref={storyRef} className="fade-in" style={{
                    padding: '120px 0',
                    maxWidth: '800px',
                    margin: '0 auto',
                    textAlign: 'center',
                    opacity: 0,
                    transform: 'translateY(20px)',
                    transition: 'opacity 1s ease, transform 1s ease'
                }}>
                    <h2 style={{
                        fontSize: '48px',
                        fontWeight: '600',
                        marginBottom: '60px',
                        letterSpacing: '-0.5px'
                    }}>
                        My Story
                    </h2>
                    <p style={{
                        fontSize: '20px',
                        lineHeight: '1.8',
                        color: '#333',
                        fontWeight: '400',
                        maxWidth: '700px',
                        margin: '0 auto'
                    }}>
                        In silence, I came to be, where melodies and secrets turned to silent regrets within me. My deafness once isolated me, stirring tempests within and solitude around. But as I sought healing, I found myself in the mesmerizing fields of cognitive science and emotional computation. In the quiet, my search for sound mirrored a night's quest for starlight. Data science opened new worlds to me, and AI, along with interactive technology, fused numbers, sound, and feeling. My affinity for technology was more than passion—it was a dream of a world alive with sound and sentiment. The advent of hearing aids illuminated my life, revealing that technology bridges more than data and sound—it connects us at the soul, pulling me into the cosmic dance.
                    </p>
                </section>

                {/* Profile Section */}
                <section id="profile" ref={profileRef} className="fade-in" style={{
                    padding: '120px 0',
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: 0,
                    transform: 'translateY(20px)',
                    transition: 'opacity 1s ease, transform 1s ease'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#f5f5f7',
                        zIndex: -1
                    }}></div>

                    <div style={{
                        maxWidth: '1200px',
                        margin: '0 auto',
                        padding: '0 40px',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '80px',
                        alignItems: 'center'
                    }}>
                        <div style={{
                            position: 'relative'
                        }}>
                            <div style={{
                                position: 'relative',
                                overflow: 'hidden',
                                borderRadius: '24px',
                                boxShadow: '0 50px 100px rgba(0, 0, 0, 0.15)',
                                transform: 'perspective(1000px) rotateY(-5deg)',
                                transition: 'all 0.5s ease'
                            }}>
                                <img
                                    src="/assets/WechatIMG371.jpeg"
                                    alt="Profile"
                                    style={{
                                        width: '100%',
                                        display: 'block',
                                        transition: 'transform 0.5s ease'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '30px'
                        }}>
                            <div>
                                <h3 style={{
                                    fontSize: '16px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1.5px',
                                    color: '#888',
                                    marginBottom: '10px'
                                }}>
                                    Researcher & Developer
                                </h3>
                                <h2 style={{
                                    fontSize: '48px',
                                    fontWeight: '600',
                                    letterSpacing: '-0.5px',
                                    lineHeight: '1.2'
                                }}>
                                    Hi, I'm Xingrui Gu
                                </h2>
                            </div>

                            <p style={{
                                fontSize: '18px',
                                lineHeight: '1.7',
                                color: '#333'
                            }}>
                                I'm deeply passionate about exploring the intricacies of the human mind and its interaction with technology. My research primarily focuses on Human Intuitive Reasoning, especially in Causal and Bayesian Reasoning, which allows us to understand how people make sense of the world around them through mathematical language.
                            </p>

                            <p style={{
                                fontSize: '18px',
                                lineHeight: '1.7',
                                color: '#333'
                            }}>
                                I'm also highly interested in Human Centered Computing, Affective Computing, Reinforcement Learning and Human-Computer Interaction, areas where I aim to further contribute by developing more intuitive and effective AI technology interfaces.
                            </p>

                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                flexWrap: 'wrap',
                                marginTop: '10px'
                            }}>
                                {['HCI', 'AI', 'Cognitive Science', 'Machine Learning'].map(tag => (
                                    <span key={tag} style={{
                                        padding: '8px 20px',
                                        background: '#fff',
                                        borderRadius: '40px',
                                        fontSize: '16px',
                                        color: '#333',
                                        fontWeight: '500'
                                    }}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Brief Experience Section */}
                <section id="experience" ref={briefRef} className="fade-in" style={{
                    padding: '120px 40px',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    opacity: 0,
                    transform: 'translateY(20px)',
                    transition: 'opacity 1s ease, transform 1s ease'
                }}>
                    <h2 style={{
                        fontSize: '48px',
                        fontWeight: '600',
                        marginBottom: '60px',
                        textAlign: 'center',
                        letterSpacing: '-0.5px'
                    }}>
                        Experience
                    </h2>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '30px'
                    }}>
                        {[
                            { date: '2024.06 - 2024.08', org: 'INNO Angel Fund' },
                            { date: '2024.06 - 2024.08', org: 'Microsoft' },
                            { date: '2023.10 - 2024.06', org: 'The Future Laboratory, Tsinghua University' },
                            { date: '2023.05 - 2023.10', org: 'Centre for Artificial Intelligence, UCL' },
                            { date: '2023.05 - 2023.09', org: 'Institute for Al Industry Research, Tsinghua University' },
                            { date: '2022.09 - 2023.01', org: 'Stanford E-China, Stanford University' },
                            { date: '2022.07 - 2022.08', org: 'International Innovative Practice Summer Camp, Shanghai Jiao Tong University' },
                            { date: '2021.12 - 2024.03', org: 'LJÜS LIGHTEN US LTD' },
                            { date: '2021.09 - 2021.11', org: 'Institute for Al Industry Research, Tsinghua University' },
                            { date: '2021.07 - 2021.09', org: 'Institute of Radiological Medicine, Chinese Academy of Medical Sciences' },
                            { date: '2020.08 - 2020.12', org: 'China Automotive Technology and Research Center Co. Ltd' }
                        ].map((exp, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                backgroundColor: '#fff',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                            }}>
                                <div style={{
                                    width: '200px',
                                    padding: '24px',
                                    backgroundColor: '#f5f5f7',
                                    fontWeight: '600',
                                    fontSize: '16px'
                                }}>
                                    {exp.date}
                                </div>
                                <div style={{
                                    padding: '24px',
                                    fontSize: '18px',
                                    flex: 1
                                }}>
                                    {exp.org}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Publications Section */}
                <section id="research" ref={publicationRef} className="fade-in" style={{
                    padding: '120px 0',
                    backgroundColor: '#f5f5f7',
                    opacity: 0,
                    transform: 'translateY(20px)',
                    transition: 'opacity 1s ease, transform 1s ease'
                }}>
                    <div style={{
                        maxWidth: '1200px',
                        margin: '0 auto',
                        padding: '0 40px'
                    }}>
                        <h2 style={{
                            fontSize: '48px',
                            fontWeight: '600',
                            marginBottom: '60px',
                            textAlign: 'center',
                            letterSpacing: '-0.5px'
                        }}>
                            Research & Publications
                        </h2>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                            gap: '30px'
                        }}>
                            {[
                                {
                                    title: "Advancing Multimodal Data Fusion in Pain Recognition",
                                    link: "https://arxiv.org/abs/2404.00320",
                                    status: "Accepted (ACII AHRI Workshop)"
                                },
                                {
                                    title: "CauSkelNet: Causal Representation Learning for Human Behaviour Analysis",
                                    link: "https://arxiv.org/abs/2409.15564",
                                    status: "Accepted (IEEE Automatic Face and Gesture Recognition)"
                                },
                                {
                                    title: "Cognitive Belief Driven Reinforcement Learning",
                                    link: "#",
                                    status: "Under Review (ICML)"
                                }
                            ].map((pub, index) => (
                                <div key={index} style={{
                                    backgroundColor: '#fff',
                                    borderRadius: '20px',
                                    overflow: 'hidden',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                                }}>
                                    <div style={{
                                        height: '6px',
                                        background: 'linear-gradient(90deg, #000, #444)'
                                    }}></div>
                                    <div style={{
                                        padding: '30px'
                                    }}>
                                        <h3 style={{
                                            fontSize: '20px',
                                            fontWeight: '600',
                                            marginBottom: '20px',
                                            lineHeight: '1.4'
                                        }}>
                                            {pub.link !== "#" ? (
                                                <a href={pub.link} target="_blank" rel="noopener noreferrer" style={{
                                                    color: '#000',
                                                    textDecoration: 'none',
                                                    transition: 'color 0.2s ease'
                                                }}>
                                                    {pub.title}
                                                </a>
                                            ) : pub.title}
                                        </h3>
                                        <p style={{
                                            color: '#666',
                                            fontSize: '16px'
                                        }}>
                                            {pub.status}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Honors Section */}
                <section ref={honorsRef} className="fade-in" style={{
                    padding: '120px 40px',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    opacity: 0,
                    transform: 'translateY(20px)',
                    transition: 'opacity 1s ease, transform 1s ease'
                }}>
                    <h2 style={{
                        fontSize: '48px',
                        fontWeight: '600',
                        marginBottom: '60px',
                        textAlign: 'center',
                        letterSpacing: '-0.5px'
                    }}>
                        Awards & Honors
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '30px'
                    }}>
                        {[
                            "Received an investment intention of 1.5 million RMB, 2023",
                            "\"Chunhui Cup\" Innovation and Entrepreneurship Competition for Chinese Overseas Students, Award-winning Project, 2023",
                            "\"Straight to Wuzhen\" competition, Final list, 2023",
                            "UCL Hatchery Incubator, Semi-Final list, 2023",
                            "\"To win in Suthou, Create a winning future\" venture contest, Sweden Final list, 2022",
                            "KCL Opportunity Fund, GBP 400 pounds, 2022",
                            "The KTH Innovation pre-incubator program, Final list, 2022"
                        ].map((honor, index) => (
                            <div key={index} style={{
                                backgroundColor: '#fff',
                                padding: '30px',
                                borderRadius: '16px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '15px',
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                            }}>
                                <div style={{
                                    width: '30px',
                                    height: '30px',
                                    backgroundColor: '#000',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    color: '#fff',
                                    fontWeight: '600',
                                    flexShrink: 0,
                                    fontSize: '14px'
                                }}>
                                    {index + 1}
                                </div>
                                <p style={{
                                    margin: '0',
                                    fontSize: '16px',
                                    lineHeight: '1.6'
                                }}>
                                    {honor}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Contact Section */}
                <section id="contact" ref={contactRef} className="fade-in" style={{
                    padding: '120px 0',
                    backgroundColor: '#f5f5f7',
                    opacity: 0,
                    transform: 'translateY(20px)',
                    transition: 'opacity 1s ease, transform 1s ease'
                }}>
                    <div style={{
                        maxWidth: '1200px',
                        margin: '0 auto',
                        padding: '0 40px',
                        textAlign: 'center'
                    }}>
                        <h2 style={{
                            fontSize: '48px',
                            fontWeight: '600',
                            marginBottom: '20px',
                            letterSpacing: '-0.5px'
                        }}>
                            Get in Touch
                        </h2>

                        <p style={{
                            fontSize: '20px',
                            lineHeight: '1.6',
                            maxWidth: '600px',
                            margin: '0 auto 60px',
                            color: '#555'
                        }}>
                            I'm always open to new opportunities, collaborations, and conversations.
                        </p>

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '30px',
                            maxWidth: '500px',
                            margin: '0 auto'
                        }}>
                            <div style={{
                                backgroundColor: '#fff',
                                padding: '24px',
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                                transition: 'transform 0.3s ease'
                            }}>
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    backgroundColor: '#f5f5f7',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <img src="/assets/Vector2.png" alt="Email" style={{ width: '24px', height: '24px' }} />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <p style={{ margin: '0 0 5px', fontSize: '14px', color: '#888' }}>Email</p>
                                    <p style={{ margin: '0', fontSize: '16px', fontWeight: '500' }}>x.gu.hayden@gmail.com</p>
                                </div>
                            </div>

                            <div style={{
                                backgroundColor: '#fff',
                                padding: '24px',
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                                transition: 'transform 0.3s ease'
                            }}>
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    backgroundColor: '#f5f5f7',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <img src="/assets/Vector1.png" alt="Instagram" style={{ width: '24px', height: '24px' }} />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <p style={{ margin: '0 0 5px', fontSize: '14px', color: '#888' }}>Instagram</p>
                                    <p style={{ margin: '0', fontSize: '16px', fontWeight: '500' }}>grxprc98</p>
                                </div>
                            </div>

                            <div style={{
                                backgroundColor: '#fff',
                                padding: '24px',
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                                transition: 'transform 0.3s ease'
                            }}>
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    backgroundColor: '#f5f5f7',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <img src="/assets/Vector.png" alt="LinkedIn" style={{ width: '24px', height: '24px' }} />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <p style={{ margin: '0 0 5px', fontSize: '14px', color: '#888' }}>LinkedIn</p>
                                    <a href="https://www.linkedin.com/in/xingrui-gu-1b22b0236/"
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       style={{ margin: '0', fontSize: '16px', fontWeight: '500', color: '#000', textDecoration: 'none' }}>
                                        Xingrui Gu
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer style={{
                    padding: '60px 20px',
                    backgroundColor: '#fff',
                    textAlign: 'center'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '20px'
                    }}>
                        <div onClick={toTop} style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#f5f5f7',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}>
                            <img src="/assets/kn.png" alt="To top" style={{ width: '16px', height: '16px' }} />
                        </div>
                    </div>

                    <p style={{
                        margin: '0',
                        fontSize: '14px',
                        color: '#888'
                    }}>
                        Copyright © Xingrui GU. All Rights Reserved.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default About;