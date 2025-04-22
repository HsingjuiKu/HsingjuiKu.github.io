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


                {/* Education Section */}
                <section id="education" style={{
                    padding: '120px 40px',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    <h2 style={{
                        fontSize: '48px',
                        fontWeight: '600',
                        marginBottom: '60px',
                        textAlign: 'center',
                        letterSpacing: '-0.5px'
                    }}>
                        Education
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                        gap: '40px'
                    }}>
                        {/* King's College London */}
                        <div style={{
                            backgroundColor: '#fff',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                        }}>
                            <div style={{
                                height: '200px',
                                overflow: 'hidden',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: '30px',
                                backgroundColor: '#f5f5f7'
                            }}>
                                <img
                                    src="/assets/a1.webp"
                                    alt="King's College London"
                                    style={{
                                        maxHeight: '120px',
                                        maxWidth: '100%',
                                        objectFit: 'contain'
                                    }}
                                />
                            </div>
                            <div style={{
                                padding: '30px'
                            }}>
                                <h3 style={{
                                    fontSize: '22px',
                                    fontWeight: '600',
                                    marginBottom: '10px'
                                }}>
                                    King's College London
                                </h3>
                                <p style={{
                                    fontSize: '18px',
                                    color: '#666',
                                    marginBottom: '10px'
                                }}>
                                    BSc Mathematics with Statistics
                                </p>
                                <p style={{
                                    fontSize: '16px',
                                    color: '#888'
                                }}>
                                    2019 - 2022
                                </p>
                            </div>
                        </div>

                        {/* UCL */}
                        <div style={{
                            backgroundColor: '#fff',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                        }}>
                            <div style={{
                                height: '200px',
                                overflow: 'hidden',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: '30px',
                                backgroundColor: '#f5f5f7'
                            }}>
                                <img
                                    src="/assets/a2.png"
                                    alt="University College London"
                                    style={{
                                        maxHeight: '120px',
                                        maxWidth: '100%',
                                        objectFit: 'contain'
                                    }}
                                />
                            </div>
                            <div style={{
                                padding: '30px'
                            }}>
                                <h3 style={{
                                    fontSize: '22px',
                                    fontWeight: '600',
                                    marginBottom: '10px'
                                }}>
                                    University College London
                                </h3>
                                <p style={{
                                    fontSize: '18px',
                                    color: '#666',
                                    marginBottom: '10px'
                                }}>
                                    MSc Computer Science
                                </p>
                                <p style={{
                                    fontSize: '16px',
                                    color: '#888'
                                }}>
                                    2022 - 2023
                                </p>
                            </div>
                        </div>

                        {/* UC Berkeley */}
                        <div style={{
                            backgroundColor: '#fff',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                        }}>
                            <div style={{
                                height: '200px',
                                overflow: 'hidden',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: '30px',
                                backgroundColor: '#f5f5f7'
                            }}>
                                <img
                                    src="/assets/a3.png"
                                    alt="UC Berkeley"
                                    style={{
                                        maxHeight: '120px',
                                        maxWidth: '100%',
                                        objectFit: 'contain'
                                    }}
                                />
                            </div>
                            <div style={{
                                padding: '30px'
                            }}>
                                <h3 style={{
                                    fontSize: '22px',
                                    fontWeight: '600',
                                    marginBottom: '10px'
                                }}>
                                    UC Berkeley
                                </h3>
                                <p style={{
                                    fontSize: '18px',
                                    color: '#666',
                                    marginBottom: '10px'
                                }}>
                                    MEng Electrical Engineering and Computer Science
                                </p>
                                <p style={{
                                    fontSize: '16px',
                                    color: '#888'
                                }}>
                                    Current
                                </p>
                            </div>
                        </div>
                    </div>
                </section>


                {/* Experience Section - Redesigned */}
                <section id="experience" className="fade-in" style={{
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
                        Professional Experience
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                        gap: '30px'
                    }}>
                        {[
                            {
                                period: '2024.06 - 2024.08',
                                organization: 'INNO Angel Fund',
                                role: 'Investment Analyst',
                                color: '#f0f0f2'
                            },
                            {
                                period: '2023.06 - 2023.08',
                                organization: 'Microsoft',
                                role: 'Research Intern',
                                color: '#f0f5ff'
                            },
                            {
                                period: '2023.10 - 2024.06',
                                organization: 'The Future Laboratory, Tsinghua University',
                                role: 'Research Assistant',
                                color: '#f0f5f0'
                            },
                            {
                                period: '2023.05 - 2023.10',
                                organization: 'Centre for Artificial Intelligence, UCL',
                                role: 'Research Assistant',
                                color: '#f5f0f5'
                            },
                            {
                                period: '2021.09 - 2021.11 & 2023.05 - 2023.09',
                                organization: 'Institute for AI Industry Research, Tsinghua University',
                                role: 'Research Intern',
                                color: '#f0f0f5'
                            },
                            {
                                period: '2022.09 - 2023.01',
                                organization: 'Stanford E-China, Stanford University',
                                role: 'Student Researcher',
                                color: '#fff0f0'
                            },
                            {
                                period: '2022.07 - 2022.08',
                                organization: 'International Innovative Practice Summer Camp, Shanghai Jiao Tong University',
                                role: 'Participant',
                                color: '#f0fff0'
                            },
                            {
                                period: '2021.12 - 2024.03',
                                organization: 'LJÜS LIGHTEN US LTD',
                                role: 'Co-founder',
                                color: '#f5f5f0'
                            },
                            {
                                period: '2021.07 - 2021.09',
                                organization: 'Institute of Radiological Medicine, Chinese Academy of Medical Sciences',
                                role: 'Research Intern',
                                color: '#f0f5f5'
                            },
                            {
                                period: '2020.08 - 2020.12',
                                organization: 'China Automotive Technology and Research Center Co. Ltd',
                                role: 'Research Intern',
                                color: '#f5f0f0'
                            }
                        ].map((exp, index) => (
                            <div key={index} style={{
                                backgroundColor: '#fff',
                                borderRadius: '20px',
                                overflow: 'hidden',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{
                                    backgroundColor: exp.color,
                                    padding: '25px 30px',
                                    borderBottom: '1px solid rgba(0,0,0,0.05)'
                                }}>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: '#555'
                                    }}>
                                        {exp.period}
                                    </p>
                                </div>
                                <div style={{
                                    padding: '25px 30px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px',
                                    flex: 1
                                }}>
                                    <h3 style={{
                                        fontSize: '20px',
                                        fontWeight: '600',
                                        margin: 0
                                    }}>
                                        {exp.organization}
                                    </h3>
                                    <p style={{
                                        fontSize: '16px',
                                        color: '#666',
                                        margin: 0
                                    }}>
                                        {exp.role}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Publications Section - Redesigned */}
                <section id="publications" className="fade-in" style={{
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
                            Publications
                        </h2>

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '30px'
                        }}>
                            {/* Publication 1 */}
                            <div style={{
                                backgroundColor: '#fff',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                            }}>
                                <div style={{
                                    padding: '40px',
                                    borderBottom: '1px solid #f0f0f0'
                                }}>
                                    <h3 style={{
                                        fontSize: '24px',
                                        fontWeight: '600',
                                        marginBottom: '16px',
                                        lineHeight: '1.4'
                                    }}>
                                        <a href="https://arxiv.org/abs/2404.00320"
                                           target="_blank"
                                           rel="noopener noreferrer"
                                           style={{
                                               color: '#000',
                                               textDecoration: 'none',
                                               transition: 'color 0.2s ease',
                                               display: 'inline-flex',
                                               alignItems: 'center',
                                               gap: '10px'
                                           }}>
                                            Advancing Multimodal Data Fusion in Pain Recognition
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                <polyline points="15 3 21 3 21 9"></polyline>
                                                <line x1="10" y1="14" x2="21" y2="3"></line>
                                            </svg>
                                        </a>
                                    </h3>
                                    <p style={{
                                        fontSize: '18px',
                                        lineHeight: '1.6',
                                        color: '#444'
                                    }}>
                                        A Strategy Leveraging Statistical Correlation and Human-Centered Perspectives
                                    </p>
                                </div>
                                <div style={{
                                    padding: '20px 40px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    backgroundColor: '#fafafa'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <div style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            backgroundColor: '#34c759' // Apple's green
                                        }}></div>
                                        <span style={{
                                            fontSize: '16px',
                                            color: '#666'
                                        }}>
                            Accepted
                        </span>
                                    </div>
                                    <p style={{
                                        fontSize: '16px',
                                        color: '#666'
                                    }}>
                                        ACII AHRI Workshop
                                    </p>
                                </div>
                            </div>

                            {/* Publication 2 */}
                            <div style={{
                                backgroundColor: '#fff',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                            }}>
                                <div style={{
                                    padding: '40px',
                                    borderBottom: '1px solid #f0f0f0'
                                }}>
                                    <h3 style={{
                                        fontSize: '24px',
                                        fontWeight: '600',
                                        marginBottom: '16px',
                                        lineHeight: '1.4'
                                    }}>
                                        <a href="https://arxiv.org/abs/2409.15564"
                                           target="_blank"
                                           rel="noopener noreferrer"
                                           style={{
                                               color: '#000',
                                               textDecoration: 'none',
                                               transition: 'color 0.2s ease',
                                               display: 'inline-flex',
                                               alignItems: 'center',
                                               gap: '10px'
                                           }}>
                                            CauSkelNet: Causal Representation Learning for Human Behaviour Analysis
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                <polyline points="15 3 21 3 21 9"></polyline>
                                                <line x1="10" y1="14" x2="21" y2="3"></line>
                                            </svg>
                                        </a>
                                    </h3>
                                </div>
                                <div style={{
                                    padding: '20px 40px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    backgroundColor: '#fafafa'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <div style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            backgroundColor: '#34c759' // Apple's green
                                        }}></div>
                                        <span style={{
                                            fontSize: '16px',
                                            color: '#666'
                                        }}>
                            Accepted
                        </span>
                                    </div>
                                    <p style={{
                                        fontSize: '16px',
                                        color: '#666'
                                    }}>
                                        IEEE Automatic Face and Gesture Recognition
                                    </p>
                                </div>
                            </div>

                            {/* Publication 3 */}
                            <div style={{
                                backgroundColor: '#fff',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                            }}>
                                <div style={{
                                    padding: '40px',
                                    borderBottom: '1px solid #f0f0f0'
                                }}>
                                    <h3 style={{
                                        fontSize: '24px',
                                        fontWeight: '600',
                                        marginBottom: '16px',
                                        lineHeight: '1.4'
                                    }}>
                                        Cognitive Belief Driven Reinforcement Learning
                                    </h3>
                                </div>
                                <div style={{
                                    padding: '20px 40px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    backgroundColor: '#fafafa'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <div style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            backgroundColor: '#ff9f0a' // Apple's orange
                                        }}></div>
                                        <span style={{
                                            fontSize: '16px',
                                            color: '#666'
                                        }}>
                            Under Review
                        </span>
                                    </div>
                                    <p style={{
                                        fontSize: '16px',
                                        color: '#666'
                                    }}>
                                        ICML
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>


                <section className="flex-row">
                    <div className="left">
                        <h2>Honors</h2>
                    </div>
                    <div className="right " style={{ width: '70%', display: 'flex', flexDirection: 'column' }}>
                        <p>● "Chunhui Cup"lnnovation and Entrepreneurship Competition for Chinese OverseasStudents, Award-winning Project, 2023</p>
                        <p>● KCL Opportunity Fund, GBP 400 pounds, 2022</p>
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