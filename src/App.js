import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/home/Home";
import About from "./pages/about/About";
import MoodClip from "./pages/moodClip/MoodClip";
import MiniProgram from "./pages/miniProgram/MiniProgram";

import { HashRouter } from 'react-router-dom';

import { useContext } from "react";
import LjUs from "./pages/LjUs/LjUs";
import ExerciseApp from "./pages/exerciseApp/exerciseApp";
import RL from "./pages/rl/rl";

function App() {
  return (<div className="app">
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {/*<Route path="home" element= />*/}
        <Route path="/about" element={<About />} />
        <Route path="moodClip" element={<MoodClip />} />
        <Route path="miniprogram" element={<MiniProgram />} />
        <Route path="ljus" element={<LjUs />} />
        <Route path="exerciseapp" element={<ExerciseApp />} />
        <Route path="rl" element={<RL />} />
      </Routes>
    </HashRouter>
  </div>
  );
}

export default App;
