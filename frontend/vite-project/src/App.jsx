import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/landing";
import Authentication from "./pages/authentication";
import VideoMeetComponent from "./pages/videomeet";

import { AuthProvider } from "./contexts/AuthContext.jsx";

import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>

          {/* Landing Page */}
          <Route
            path="/"
            element={<LandingPage />}
          />

          {/* Authentication Page */}
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
      </Router>
    </AuthProvider>
  );
}

export default App;