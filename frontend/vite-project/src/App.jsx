/*import React from 'react'
import LandingPage from './pages/landing'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Authentication from './pages/authentication'
import './App.css'
import { AuthProvider } from './contexts/AuthContext.jsx'
import VideoMeetComponent from "./pages/Videomeet"

function App() {
  return (
    <div classname="App">
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Authentication />} />
            <Route path ="/:url" element = {<VideoMeetComponent/>}/>
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  )
}

export default App
*/

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/landing";
import Authentication from "./pages/authentication";
import VideoMeetComponent from "./pages/videomeet";

import { AuthProvider } from "./contexts/AuthContext.jsx";

import "./App.css";

function App() {
    return (
        <div className="App">
            <Router>
                <AuthProvider>
                    <Routes>

                        {/* Landing Page */}
                        <Route
                            path="/"
                            element={<LandingPage />}
                        />

                        {/* Login Page */}
                        <Route
                            path="/auth"
                            element={<Authentication />}
                        />

                        {/* Video Meeting Room */}
                        <Route
                            path="/:roomId"
                            element={<VideoMeetComponent />}
                        />

                    </Routes>

                    <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/auth" element={<Auth />} />
</Routes>
                </AuthProvider>
            </Router>
        </div>
    );
}

export default App;