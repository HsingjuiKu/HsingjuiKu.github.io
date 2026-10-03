import { BrowserRouter, Routes, Route, Navigate, HashRouter } from "react-router-dom";
import Home from "./pages/home/Home";
import About from "./pages/about/About";
import MoodClip from "./pages/moodClip/MoodClip";
import MiniProgram from "./pages/miniProgram/MiniProgram";


import LjUs from "./pages/LjUs/LjUs";
import ExerciseApp from "./pages/exerciseApp/exerciseApp";
import RL from "./pages/rl/rl";
import NeuralHear from "./pages/neuralHear/NeuralHear"
import Almour from "./pages/almour/Almour";
import WhaleFall from "./whalefall/WhaleFall";
import Echo from "./echo/Echo";
function App() {
  return (<div className="app">
    <HashRouter baseline="/">
      <Routes>
        <Route exact path={process.env.PUBLIC_URL + '/'} element={<WhaleFall />} />
        <Route exact path={process.env.PUBLIC_URL + '/classic'} element={<Home />} />
        <Route exact path={process.env.PUBLIC_URL + '/about'} element={<Echo />} />
        <Route exact path={process.env.PUBLIC_URL + '/about/classic'} element={<About />} />
        <Route exact path={process.env.PUBLIC_URL + '/moodclip'} element={<MoodClip />} />
        <Route exact path={process.env.PUBLIC_URL + '/miniprogram'} element={<MiniProgram />} />
        <Route exact path={process.env.PUBLIC_URL + '/ljus'} element={<LjUs />} />
        <Route exact path={process.env.PUBLIC_URL + '/exerciseapp'} element={<ExerciseApp />} />
        <Route exact path={process.env.PUBLIC_URL + '/rl'} element={<RL />} />
        <Route exact path={process.env.PUBLIC_URL + '/neuralhear'} element={<NeuralHear />} />
        <Route exact path={process.env.PUBLIC_URL + '/almour'} element={<Almour />} />
      </Routes>
    </HashRouter>
    </div>
  );
}

export default App;
