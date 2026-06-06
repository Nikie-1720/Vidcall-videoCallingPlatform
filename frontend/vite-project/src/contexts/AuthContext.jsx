import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext, client } from "./authContext.js";

export const AuthProvider = ({ children }) => {
    const [userData, setUserData] = useState(null);
    const navigate = useNavigate();

    const handleRegister = useCallback(async (name, username, password) => {
        try {
            const request = await client.post("/register", {
                name,
                username,
                password,
            });
            return request.data?.message;
        } catch (err) {
            console.error("Registration Error:", err);
            throw err;
        }
    }, []);

    const handleLogin = useCallback(async (username, password) => {
        try {
            const request = await client.post("/login", {
                username,
                password,
            });

            if (request.status === 200 && request.data?.token) {
                localStorage.setItem("token", request.data.token);
                setUserData({ username });
                navigate("/");
                return request.data.token;
            }

            throw new Error(request.data?.message || "Login failed");
        } catch (err) {
            console.error("Login Error:", err);
            throw err;
        }
    }, [navigate]);

   

    return (
        <AuthContext.Provider value={{userData, setUserData, handleRegister, handleLogin} }>
            {children}
        </AuthContext.Provider>
    );
};