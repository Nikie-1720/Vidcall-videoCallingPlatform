import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";

export default function LandingPage() {
    const navigate = useNavigate();

    const joinAsGuest = () => {
        const roomId = Math.random().toString(36).slice(2, 10);
        navigate(`/${roomId}`);
    };

    return (
        <div className="landing-container">
            <nav>
                <div className="nav-container">
                    <div className="Title">VidCall</div>

                    <div className="nav-links">
                        <div className="JoinGuest" onClick={joinAsGuest} role="button" tabIndex={0}>
                            Join as Guest
                        </div>
                        <div
                            className="Register"
                            onClick={() => navigate("/auth", { state: { mode: "register" } })}
                            role="button"
                            tabIndex={0}
                        >
                            Register
                        </div>
                        <button className="Login" onClick={() => navigate("/auth")}>
                            Login
                        </button>
                    </div>
                </div>
            </nav>

            <div className="hero-section">
                <div className="Text">
                    <div>
                        <h1>
                            <span style={{ color: "chocolate" }}>Connect</span> to VidCall
                        </h1>
                        <p>Connect with your loved ones anytime, anywhere.</p>
                    </div>
                    <div>
                        <Link to="/auth">
                            <button className="getstarted">Get Started</button>
                        </Link>
                    </div>
                </div>

                <div className="Image-container">
                    <img src="/compressed_vidcall.png" className="Hero-image" />
                </div>
            </div>
        </div>
    );
}