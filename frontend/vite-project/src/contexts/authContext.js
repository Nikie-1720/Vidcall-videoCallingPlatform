import { createContext } from "react";
import axios from "axios";
import server from "../environment";  // ✅ moved to top with other imports

export const AuthContext = createContext({});

export const client = axios.create({
  baseURL: `${server}/api/v1/users`,
});