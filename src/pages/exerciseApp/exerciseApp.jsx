import React, { useState } from "react";
import { Document, Page } from 'react-pdf';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import "./exerciseApp.scss";
import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const ExerciseAPP = () => {

    const [activeTab, setActiveTab] = useState(0);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1); // Set the default page to 1

    // const [inputPageNumber, setInputPageNumber] = useState("");

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

    // const jumpToPage = () => {
    //     const newPageNumber = Number(inputPageNumber);
    //     if (newPageNumber >= 1 && newPageNumber <= numPages) {
    //         setPageNumber(newPageNumber);
    //     } else {
    //         alert('Please enter a valid page number.');
    //     }
    // };

    return (
        <div className="exerciseApp">
            <div className="exerciseAppContainer">
                <div className="logo"><a href="/"><img src="/assets/logo.png" alt="" /></a></div>
                <section>
                    <h2 className="h-t">UCL Exercises Web Application For NHS</h2>
                    <h3>Centralized Physiotherapy Resource Platform</h3>
                    {/*<p>Platform & Tech: Machine Learning, Human Computer Interaction and Human Machine Interaction</p>*/}
                    <p>Time: 2023.01 - 2023.05</p>
                    <p>Location: London,UK</p>
                    <p>Role: UX Designer, Full Stack Developer</p>
                    <p>Supervisor: Dr.Yun Fu</p>
                    <p className="bold">Theme: User experience, Software Engineering</p>
                </section>

                <section>
                    <Carousel showThumbs={false} autoPlay={true}>
                        <div>
                            <img src="/assets/exerciseApp/Exercise Web App.png" alt="" />
                        </div>
                        <div>
                            <img src="/assets/exerciseApp/Exercise Web App1.png" alt="" />
                        </div>
                    </Carousel>
                    <h3 style={{ fontWeight: 'bold', fontSize: '30px' }}>Program Introduction</h3>
                    <p className="centered-paragraph">
                        Welcome to the UCL Exercises Web Application – a groundbreaking digital solution aimed at revolutionizing the physiotherapy landscape. Jointly developed by UCL Computer Science, NHS England, and supported by organizations like the ALS MND Association, our web application emerges as a response to the critical need for a cohesive, user-friendly platform in the realm of physiotherapy.
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
                                Our initiative, the UCL Exercises Web Application, addresses the vital need for a cohesive, integrated approach in physiotherapy—a field that is quintessential for the rehabilitation and enhancement of physical health. Recognizing the barriers presented by a fragmented healthcare system, we envisioned a user-centric digital environment that consolidates physiotherapy exercises into a responsive web application. This platform is meticulously designed to provide not just a collection of exercises, but a dynamic, tailored experience complete with a comprehensive database and interactive video tutorials. The purposeful design is accentuated by advanced search functionalities, customizable exercise chains, and a responsive layout, ensuring that whether on a tablet or a laptop, the right exercise regimen is at the user's fingertips. By integrating these features, our vision is to create a streamlined rehabilitation process, empowering patients to actively participate and clinicians to efficiently manage treatment.
                            </p>
                        </div>
                        <div className={`tab-content-item ${activeTab === 1 ? "active" : ""}`}>
                            <p className="centered-paragraph">
                                The development of the UCL Exercises Web Application was a symbiotic process, intertwining the insights of healthcare professionals and the experiences of patients with the precision of modern technology. Through a collaborative development approach, guided by user research and the MoSCoW method, we identified and focused on the most critical features, creating a solution firmly grounded in the real-world needs of its users. This user-first mentality was brought to life through continuous feedback and iterative design, utilizing the flexibility of Figma for prototyping. Technologically, the application is a testament to cutting-edge development practices, leveraging the power of Node.js and Express for robust server-side functions, with MySQL for comprehensive data management. The front end harnesses the reactiveness of React, HTML's ease, and CSS's styling capabilities to deliver an interactive and engaging user interface. Hosted on an Azure virtual machine, the application stands as a beacon of reliability and adaptability—poised to evolve with the advancing tides of both healthcare needs and technological advancements.
                            </p>
                        </div>
                        <div className={`tab-content-item ${activeTab === 2 ? "active" : ""}`}>
                            <p className="centered-paragraph">
                                The UCL Exercises Web App is not just a platform; it’s a commitment to enhancing the therapeutic journey for those undergoing physiotherapy. It's a tool that strives to simplify the complex, personalize the generic, and unify the segmented landscape of physiotherapy exercises. By embracing technology, we aim to forge a path to better health outcomes and heightened patient satisfaction, one exercise at a time.
                            </p>
                        </div>
                    </div>

                </section>

                {/*<section>*/}
                {/*    <img src="/assets/exerciseApp/Exercise Web App.png" alt="" />*/}
                {/*</section>*/}

                <section>
                    <img src="/assets/exerciseApp/Exercise Web App1.png" alt="" />
                </section>


                <section>
                    <h2 className="h-t">Report</h2>
                    <div className="pdf-reader">
                        <Document
                            file="assets/exerciseApp/App_Engineering.pdf"
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

export default ExerciseAPP