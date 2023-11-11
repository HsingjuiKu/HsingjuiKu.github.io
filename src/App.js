import { BrowserRouter, Routes, Route, Navigate, HashRouter } from "react-router-dom";
import Home from "./pages/home/Home";
import About from "./pages/about/About";
import MoodClip from "./pages/moodClip/MoodClip";
import MiniProgram from "./pages/miniProgram/MiniProgram";


import LjUs from "./pages/LjUs/LjUs";
import ExerciseApp from "./pages/exerciseApp/exerciseApp";
import RL from "./pages/rl/rl";

function App() {
  return (<div className="app">
    <HashRouter baseline="/">
      <Routes>
        <Route exact path={process.env.PUBLIC_URL + '/'} element={<Home />} />
        {/*<Route path="home" element={<Home />} />*/}
        <Route exact path={process.env.PUBLIC_URL + '/about'} element={<About />} />
        <Route path={process.env.PUBLIC_URL + '/moodclip'} element={<MoodClip />} />
        <Route path="/miniprogram" element={<MiniProgram />} />
        <Route path="/ljus" element={<LjUs />} />
        <Route path="/exerciseapp" element={<ExerciseApp />} />
        <Route path="/rl" element={<RL />} />
      </Routes>
    </HashRouter>
    </div>
  );
}

export default App;
