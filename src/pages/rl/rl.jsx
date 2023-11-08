import React, { useState } from "react";
import { Document, Page } from 'react-pdf';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import "./rl.scss";
import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const RL = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1); // Set the default page to 1


    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };


    const toTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const handlePageChange = (event) => {
        let page = parseInt(event.target.value, 10);
        if(page >= 1 && page <= numPages) {
            setPageNumber(page);
        }
    };

    return (
        <div className="RL">
            <div className="RLContainer">
                <div className="logo"><a href="/home"><img src="/assets/logo.png" alt="" /></a></div>
                <section>
                    <h2 className="h-t">Deep Reinforcement in Smoothed Q Learning</h2>
                    <h3>An Innovation Algorithm in DQN</h3>
                    {/*<p>Platform & Tech: IOS, Python, Miro and Figma*/}
                    {/*</p>*/}
                    <p>Time: 2023.05-2023.10</p>
                    <p>Location: London, UK</p>
                    <p>Role: Researcher</p>
                    <p>Supervisor: Prof. David Barber</p>

                </section>

                <section>
                    <Carousel showThumbs={false} autoPlay={true}>
                        <div>
                            <img src="/assets/rl/Frame 329.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/rl/Frame 332.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/rl/Frame 330.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/rl/Frame 331.png" alt="" />
                        </div>

                        <div>
                            <img src="/assets/rl/Frame 333.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/rl/Frame 334.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/rl/Frame 335.png" alt="" />
                        </div>
                    </Carousel>
                    <br/>
                    <br/>
                    <br/>

                    <h3 style={{ fontWeight: 'bold', fontSize: '30px' }}>Abstract</h3>
                    <p className="centered-paragraph">
                        In the field of model-free reinforcement learning, traditional algorithms such as Q-Learning and its extension, Deep Q-Networks (DQN), often face performance limitations, particularly in the early stages of learning within complex environments. These limitations arise primarily from the computational challenges associated with refining imprecise estimates of the state-action value function. To mitigate these issues, this work explores the theoretical foundations of Smoothed Q-Learning and extends this framework to deep reinforcement learning, introducing Smoothed Deep Q-Networks (SDQN). Employing the smoothing strategies inherent in Smoothed Q-Learning, SDQN computes a weighted average of Q-values for each possible action, based on their respective probabilities. This approach effectively reduces bias in the estimation of the state-action value function and expedites convergence to optimal policies. Empirical results, obtained from experiments conducted in virtual environments, indicate that both Smoothed Q-Learning and SDQN achieve faster convergence rates and more stable learning trajectories compared to their traditional counterparts.
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
                                Smoothed Q-Learning and Smoothed Deep Q-Networks (SDQNs) enhance traditional reinforcement learning by integrating statistical smoothing techniques, crucial for dealing with noisy or uncertain data in complex environments. Smoothing, through strategies like Softmax and Clipped Max, broadens the Q-value update process, promoting a more resilient policy evolution by generalizing across similar states and actions. SDQNs extend this concept by leveraging deep learning to handle high-dimensional spaces, allowing for sophisticated pattern recognition and function approximation. Both methods embed statistical confidence measures, such as the Chernoff-Hoeffding bound, to assess the reliability of Q-values and employ entropy regularization to foster exploration, prevent premature convergence, and maintain adaptability. This synthesis of statistical insight with RL principles makes Smoothed Q-Learning and SDQNs robust and efficient learning architectures, indicative of cutting-edge progress in adaptive, precise decision-making models.
                            </p>
                        </div>
                        <div className={`tab-content-item ${activeTab === 1 ? "active" : ""}`}>
                            <p className="centered-paragraph">
                                The project involving Smoothed Q-Learning and Smoothed Deep Q-Networks (SDQNs) unfolds through a meticulous process that starts with the identification and application of smoothing strategies to the Q-learning framework. This involves selecting appropriate smoothing operators like Softmax or Clipped Max to diffuse observed rewards and update Q-values in a way that accounts for uncertainty and noise in data. Following this, deep learning techniques are employed to create SDQNs, which utilize neural networks to approximate and infer the complex structure of the environment from high-dimensional state and action spaces. The process also rigorously incorporates statistical confidence measures, such as the Chernoff-Hoeffding bound, to provide a probabilistic assessment of the learned Q-values' reliability. Additionally, entropy regularization is integrated into the learning algorithm to balance exploration with exploitation, ensuring robustness and preventing premature policy convergence. This systematic approach, grounded in both statistical theory and reinforcement learning principles, culminates in the development of algorithms capable of efficient and stable learning in challenging and dynamic environments.
                            </p>
                        </div>
                        <div className={`tab-content-item ${activeTab === 2 ? "active" : ""}`}>
                            <p className="centered-paragraph">
                                In this experiment, I have largely achieved all predefined objectives. It is pertinent to note that the Atari 2600 gaming environment is currently the benchmark for empirical validation in the majority of extant deep reinforcement learning literature. Consequently, to furnish the most rigorous verification of our Smoothed Deep Q-Networks (SDQN) algorithm, further testing in the complex, high-dimensional action-state spaces of Atari 2600 games is imperative. Given the computational intensity and the substantial resources required for such an endeavour, the research is constrained by both time and computational capacity. However, I am committed to expeditiously conducting this scientifically rigorous experiment as soon as feasible. In terms of critical evaluation, while the project has met its goals to a significant extent, the ultimate validation in the context of Atari 2600 remains pending due to resource limitations. The choice of implementation technology and design practices have been in line with industry standards, but the true test of the application's fitness for purpose will be its performance in the more challenging Atari 2600 environment.
                            </p>
                        </div>
                    </div>

                </section>


                {/*<section>*/}
                {/*    <img src="/assets/rl/Frame 329.png" alt="" />*/}
                {/*</section>*/}
                <section>
                    <img src="/assets/rl/Frame 332.png" alt="" />
                </section>
                <section>
                    <img src="/assets/rl/Frame 330.png" alt="" />
                </section>
                <section>
                    <img src="/assets/rl/Frame 331.png" alt="" />
                </section>
                <section>
                    <img src="/assets/rl/Frame 333.png" alt="" />
                </section>
                <section>
                    <img src="/assets/rl/Frame 334.png" alt="" />
                </section>
                <section>
                    <img src="/assets/rl/Frame 335.png" alt="" />
                </section>


                <section>
                    <h2 className="h-t">Thesis</h2>
                    <div className="pdf-reader">
                        <Document
                            file="/assets/rl/COMP0073_ZYWB7.pdf"
                            onLoadSuccess={onDocumentLoadSuccess}
                        >
                            <Page pageNumber={pageNumber} renderTextLayer={false} renderAnnotationLayer={false} className="pdf-page"/>
                        </Document>
                        <div className="pagination-container">
                            <button onClick={() => setPageNumber(pageNumber - 1)} disabled={pageNumber <= 1} className="btn">
                                Prev
                            </button>
                            <input
                                type="number"
                                value={pageNumber}
                                onChange={handlePageChange}
                                className="pagination-input"
                                min="1"
                                max={numPages}
                                title="Enter page number"
                            />
                            <button onClick={() => setPageNumber(pageNumber + 1)} disabled={pageNumber >= numPages} className="btn">
                                Next
                            </button>
                            <span className="pagination-info">
                                Page {pageNumber} of {numPages}
                            </span>
                        </div>
                    </div>
                </section>


                <div className="footer">
                    <img src="/assets/kn.png" alt="" onClick={toTop} />
                    <p>Copyright © Xingrui GU. All Rights Reserved.</p>

                </div>

            </div>
        </div>

    );

};

export default RL