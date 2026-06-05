import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    room: { type: String, required: true, index: true },
    sender: { type: String, required: true },
    data: { type: String, required: true },
    socketIdSender: { type: String },
    createdAt: { type: Date, default: Date.now, index: true },
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
