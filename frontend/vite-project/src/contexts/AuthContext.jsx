
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext, client } from "./authContext";

export const AuthProvider = ({ children }) => {
    const [userData, setUserData] = useState(null);

    const navigate = useNavigate();

    const handleRegister = async (name, username, password) => {
        try {
            const request = await client.post("/register", {
                name,
                username,
                password,
            });

            if (request.status === 201) {
                return request.data.message;
            }

            // return server message if present
            return request.data?.message;
        } catch (err) {
            console.error("Registration Error:", err);
            throw err;
        }
    };

    const handleLogin = async (username, password) => {
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
    };

    const data = {
        userData,
        setUserData,
        handleRegister,
        handleLogin,
    };

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    );
};