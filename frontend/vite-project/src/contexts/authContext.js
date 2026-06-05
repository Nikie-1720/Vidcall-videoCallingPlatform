import { createContext } from "react";
import axios from "axios";

export const AuthContext = createContext({});
import server from "../environment";

export const client = axios.create({
  baseURL: `${server}/api/v1/users`,
});