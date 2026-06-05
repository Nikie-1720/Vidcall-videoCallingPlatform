import express from "express";
import cors from "cors";
import {Server} from "socket.io";

import {createServer} from "http";
import connectToSocket from "./controllers/socketManager.js";
import mongoose from "mongoose";
import {router} from "./routers/user_routes.js";
import messageRouter from "./routers/message_routes.js";

const app = express();
const server= createServer(app);
const io = connectToSocket(server);
MONGO_URI:"mongodb://127.0.0.1:27017/vidcall";

const PORT = Number(process.env.PORT) || 8000;


const MONGO_URI = process.env.MONGO_URI;
//MONGO_URI:"mongodb://127.0.0.1:27017/vidcall";

console.log("MONGO_URI exists:", !!MONGO_URI);



app.use(cors());
app.use(express.json({limit:"40kb"}));
app.use(express.urlencoded({limit:"40kb", extended:true}));
app.use("/api/v1/users", router);
app.use("/api/v1/messages", messageRouter);

const start = async () => {
    try {
        app.set( "Nikita");
        if (!MONGO_URI) {
    throw new Error("MONGO_URI environment variable is missing");
}

const connectionDB = await mongoose.connect(MONGO_URI);
        console.log(`Connected to MongoDB at ${connectionDB.connection.host}:${connectionDB.connection.port}`);

        server.on("error", (error) => {
            if (error.code === "EADDRINUSE") {
                console.error(`Port ${PORT} is already in use. Stop the existing process or set a different PORT.`);
                process.exit(1);
            }

            console.error("Server error:", error);
            process.exit(1);
        });

        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
};



start();
