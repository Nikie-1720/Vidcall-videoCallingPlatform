import { Server } from "socket.io";
import Message from "../models/message_model.js";

let connections = {};
let timeOnline = {};

function removeSocketFromRooms(socketId) {
    for (const room of Object.keys(connections)) {
        const index = connections[room].indexOf(socketId);
        if (index !== -1) {
            connections[room].splice(index, 1);

            if (connections[room].length === 0) {
                delete connections[room];
            }

            return room;
        }
    }

    return null;
}

export default function connectToSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("A user connected: " + socket.id);

        socket.on("join-call", (path) => {
            if (connections[path] === undefined) {
                connections[path] = [];
            }

            if (!connections[path].includes(socket.id)) {
                connections[path].push(socket.id);
            }

            timeOnline[socket.id] = Date.now();

            connections[path].forEach((socketId) => {
                if (socketId !== socket.id) {
                    io.to(socketId).emit("user-joined", socket.id);
                }
            });

            io.to(socket.id).emit("user-joined", socket.id);

            // replay persisted history for this room
            (async () => {
                try {
                    const rows = await Message.find({ room: path }).sort({ createdAt: 1 }).limit(200).lean();
                    for (const row of rows) {
                        io.to(socket.id).emit("chat-message", row.data, row.sender, row.socketIdSender);
                    }
                } catch (err) {
                    console.error("Failed to load message history:", err);
                }
            })();
        });

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", async (data, sender) => {
            // find the room this socket is in
            const matchingRoom = Object.entries(connections).find(([, roomValue]) => roomValue.includes(socket.id))?.[0];
            if (!matchingRoom) return;

            try {
                const doc = await Message.create({ room: matchingRoom, sender: sender || "Anonymous", data, socketIdSender: socket.id });
            } catch (err) {
                console.error("Failed to persist message:", err);
            }

            connections[matchingRoom].forEach((socketId) => {
                io.to(socketId).emit("chat-message", data, sender, socket.id);
            });
        });

        socket.on("disconnect", () => {
            console.log("A user disconnected: " + socket.id);

            const room = removeSocketFromRooms(socket.id);
            if (room) {
                // Notify peers still present in the room before the room is gone.
                const peers = Object.values(connections[room] || []);
                peers.forEach((socketId) => {
                    io.to(socketId).emit("user-disconnected", socket.id);
                });
            }

            delete timeOnline[socket.id];
        });
    });

    return io;
}