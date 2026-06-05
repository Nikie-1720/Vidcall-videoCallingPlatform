import { createContext } from "react";
import axios from "axios";

export const AuthContext = createContext({});

export const client = axios.create({
  baseURL: "http://localhost:8000/api/v1/users",
});