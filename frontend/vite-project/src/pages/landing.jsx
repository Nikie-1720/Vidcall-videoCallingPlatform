import React from "react";
import "../App.css"

export default function LandingPage(){
    return(
        <div className="landing-container">
            <nav>
                <div className="nav-container">
                <div className="Title">VidCall</div>
                
                <div className="nav-links">
                <div className="JoinGuest">Join as Guest</div>
                <div className="Register">Register</div>
                <button className="Login">Login</button>
                </div>
                </div>
            </nav>

            <div className="hero-section">
                <div className="Text">
                    <div><h1><span style={{ color: 'chocolate' }}>Connect</span> to VidCall</h1>
                    <p>Connect with your loved ones anytime, anywhere.</p></div>
                    <div><a href="/home" ><button className="getstarted">Get Started</button></a></div>
                </div>
                
                <div className="Image-container">
                    <img src="/compressed_vidcall.png"  className="Hero-image"/>
                    
            </div>
        </div>
        </div>
        
    )
}