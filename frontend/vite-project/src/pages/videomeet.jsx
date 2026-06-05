import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import "../styles/videoComponent.css";
import server from "..environment";



export default function VideoMeetComponent() {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const socketRef = useRef(null);
    const streamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const peerConnectionsRef = useRef({});
    const location = useLocation();

    const [username, setUsername] = useState("");
    const [askForUsername, setAskForUsername] = useState(true);
    const [permissionError, setPermissionError] = useState("");
    const [deviceList, setDeviceList] = useState([]);
    const [permissionStates, setPermissionStates] = useState({ camera: "unknown", microphone: "unknown" });
    const [selectedCameraId, setSelectedCameraId] = useState("");
    const [selectedMicrophoneId, setSelectedMicrophoneId] = useState("");
    const [selectedSpeakerId, setSelectedSpeakerId] = useState("");
    const [videoAvailable, setVideoAvailable] = useState(false);
    const [audioAvailable, setAudioAvailable] = useState(false);
    const [micEnabled, setMicEnabled] = useState(true);
    const [screenAvailable,setScreenAvailable] = useState(false);
    const [screenSharing, setScreenSharing] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [chatOpen, setChatOpen] = useState(true);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

    const gotMessageFromServer = (data, sender, socketIdSender) => {
        setChatMessages((previousMessages) => [
            ...previousMessages,
            {
                data,
                sender,
                socketIdSender,
            },
        ]);
    };

    const addMessage = (event) => {
        event.preventDefault();

        const messageText = newMessage.trim();
        if (!messageText || !socketRef.current) {
            return;
        }

        socketRef.current.emit("chat-message", messageText, username || "Anonymous");
        setNewMessage("");
    };

    const appendEmoji = (emoji) => {
        setNewMessage((previousMessage) => `${previousMessage}${emoji}`);
    };

    const silence = () => {
        if (!streamRef.current) {
            return;
        }

        const nextMicEnabled = !micEnabled;
        streamRef.current.getAudioTracks().forEach((track) => {
            track.enabled = nextMicEnabled;
        });
        setMicEnabled(nextMicEnabled);
    };

    const [cameraEnabled, setCameraEnabled] = useState(true);

    const toggleCamera = () => {
        if (!streamRef.current) return;
        const next = !cameraEnabled;
        streamRef.current.getVideoTracks().forEach((track) => {
            track.enabled = next;
        });
        setCameraEnabled(next);
    };

    const hangUp = () => {
        // close peers and disconnect socket
        Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
        peerConnectionsRef.current = {};
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        setAskForUsername(true);
        setChatOpen(true);
    };

    const replaceOutgoingVideoTrack = (videoTrack) => {
        Object.values(peerConnectionsRef.current).forEach((peerConnection) => {
            const sender = peerConnection
                .getSenders()
                .find((trackSender) => trackSender.track?.kind === "video");

            if (sender) {
                sender.replaceTrack(videoTrack);
            }
        });
    };

    const stopScreenShare = async () => {
        const cameraStream = streamRef.current;

        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((track) => track.stop());
            screenStreamRef.current = null;
        }

        if (!cameraStream) {
            return;
        }

        const cameraVideoTrack = cameraStream.getVideoTracks()[0];
        if (cameraVideoTrack) {
            replaceOutgoingVideoTrack(cameraVideoTrack);
        }

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = cameraStream;
        }

        setScreenSharing(false);
    };

    const startScreenShare = async () => {
        if (!navigator.mediaDevices?.getDisplayMedia || screenSharing) {
            return;
        }

        const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false,
        });

        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];
        if (screenTrack) {
            replaceOutgoingVideoTrack(screenTrack);
        }

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
            stopScreenShare().catch((error) => {
                console.error("Failed to stop screen share:", error);
            });
        };

        setScreenSharing(true);
    };

    const requestMediaPermissions = async () => {
        const stream = await attachStream();
        return stream;
    };

    const enumerateDevicesList = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return [];
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const mappedDevices = devices.map((d) => ({ kind: d.kind, label: d.label || "(hidden)", id: d.deviceId }));
            setDeviceList(mappedDevices);

            if (!selectedCameraId) {
                const firstCamera = mappedDevices.find((device) => device.kind === "videoinput");
                if (firstCamera) setSelectedCameraId(firstCamera.id);
            }

            if (!selectedMicrophoneId) {
                const firstMic = mappedDevices.find((device) => device.kind === "audioinput");
                if (firstMic) setSelectedMicrophoneId(firstMic.id);
            }

            if (!selectedSpeakerId) {
                const firstSpeaker = mappedDevices.find((device) => device.kind === "audiooutput");
                if (firstSpeaker) setSelectedSpeakerId(firstSpeaker.id);
            }

            return devices;
        } catch (error) {
            console.error("enumerateDevices failed", error);
            return [];
        }
    };

    const queryPermissionStates = async () => {
        if (!navigator.permissions) return;
        try {
            const cam = await navigator.permissions.query({ name: "camera" });
            const mic = await navigator.permissions.query({ name: "microphone" });
            setPermissionStates({ camera: cam.state, microphone: mic.state });
        } catch {
            // ignore
        }
    };

    const checkPermissions = async () => {
        if (!navigator.permissions) return;
        try {
            const cam = await navigator.permissions.query({ name: "camera" });
            const mic = await navigator.permissions.query({ name: "microphone" });
            console.debug("Permission states -> camera:", cam.state, "mic:", mic.state);
        } catch {
            // Not all browsers support querying these names; ignore.
        }
    };

    const handleEnableMedia = async () => {
        setPermissionError("");

        try {
            const stream = await requestMediaPermissions();
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                localVideoRef.current.muted = true;
                localVideoRef.current.playsInline = true;
                localVideoRef.current.autoplay = true;
                await localVideoRef.current.play().catch(() => {});
            }
            await enumerateDevicesList();
            await queryPermissionStates();
        } catch (error) {
            console.error("Media permission error:", error);
            setPermissionError(error?.message || "Could not access camera or microphone.");
        }
    };

    const handleScreenShareToggle = async () => {
        setPermissionError("");

        try {
            if (screenSharing) {
                await stopScreenShare();
            } else {
                await startScreenShare();
            }
        } catch (error) {
            console.error("Screen share error:", error);
            setPermissionError(error?.message || "Could not start screen sharing.");
        }
    };

    const createPeerConnection = (peerId) => {
        if (!streamRef.current || !socketRef.current || peerId === socketRef.current.id) {
            return null;
        }

        if (peerConnectionsRef.current[peerId]) {
            return peerConnectionsRef.current[peerId];
        }

        const peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        streamRef.current.getTracks().forEach((track) => {
            peerConnection.addTrack(track, streamRef.current);
        });

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit("signal", peerId, {
                    ice: event.candidate,
                });
            }
        };

        peerConnection.ontrack = (event) => {
            console.debug("ontrack from peer", peerId, event);
            if (remoteVideoRef.current && event.streams[0]) {
                try {
                    remoteVideoRef.current.srcObject = event.streams[0];
                    remoteVideoRef.current.play().catch(() => {});
                } catch (err) {
                    console.error("Failed to attach remote stream:", err);
                }
            }
        };

        peerConnectionsRef.current[peerId] = peerConnection;
        return peerConnection;
    };

    const startCallWithPeer = async (peerId) => {
        const peerConnection = createPeerConnection(peerId);
        if (!peerConnection) {
            return;
        }

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socketRef.current.emit("signal", peerId, {
            sdp: peerConnection.localDescription,
        });
    };

    const handlePeerSignal = async (fromId, message) => {
        if (!streamRef.current) {
            return;
        }

        const peerConnection = createPeerConnection(fromId);
        if (!peerConnection) {
            return;
        }

        if (message.sdp) {
            const remoteDescription = new RTCSessionDescription(message.sdp);
            const offerCollision = remoteDescription.type === "offer";

            if (offerCollision && peerConnection.signalingState !== "stable") {
                await peerConnection.setLocalDescription({ type: "rollback" });
            }

            await peerConnection.setRemoteDescription(remoteDescription);

            if (remoteDescription.type === "offer") {
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                socketRef.current.emit("signal", fromId, {
                    sdp: peerConnection.localDescription,
                });
            }
        }

        if (message.ice) {
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(message.ice));
            } catch (error) {
                console.error("Error adding ICE candidate:", error);
            }
        }
    };

    
    /*const attachStream = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Media devices are not supported in this browser.");
        }

        console.debug("Requesting user media...");

        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true,
                audio: selectedMicrophoneId ? { deviceId: { exact: selectedMicrophoneId } } : true,
            });
        } catch (err) {
            console.error("getUserMedia failed:", err);
            // Try to provide more actionable info
            if (err && err.name === "NotAllowedError") {
                throw new Error("Permission denied for camera or microphone. Please allow access in the browser.");
            }
            throw err;
        }

        streamRef.current = stream;
        setMicEnabled(true);

        console.debug("Acquired media tracks:", stream.getTracks().map((t) => ({ kind: t.kind, id: t.id, enabled: t.enabled })));

        setVideoAvailable(stream.getVideoTracks().length > 0);
        setAudioAvailable(stream.getAudioTracks().length > 0);

        if (navigator.mediaDevices.getDisplayMedia) {
            setScreenAvailable(true);
        }

        if (localVideoRef.current) {
            try {
                // Ensure element is muted for autoplay policies
                localVideoRef.current.muted = true;
                localVideoRef.current.playsInline = true;
                localVideoRef.current.autoplay = true;
                // assign srcObject after muted/play attributes to increase autoplay success
                localVideoRef.current.srcObject = stream;
                await localVideoRef.current.play().catch((playErr) => {
                    console.warn("local video play() failed:", playErr);
                });
                console.debug("Local preview playing", localVideoRef.current);
            } catch (err) {
                console.error("Failed to attach local stream:", err);
            }
        }

        if (remoteVideoRef.current && selectedSpeakerId && typeof remoteVideoRef.current.setSinkId === "function") {
            remoteVideoRef.current.setSinkId(selectedSpeakerId).catch((error) => {
                console.warn("Unable to set speaker output:", error);
            });
        }

        return stream;
    };*/
    const attachStream = async () => {
    try {
        const stream =
            await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

        console.log("Stream acquired");

        streamRef.current = stream;

        setVideoAvailable(
            stream.getVideoTracks().length > 0
        );

        setAudioAvailable(
            stream.getAudioTracks().length > 0
        );

        setMicEnabled(true);

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;

            localVideoRef.current.muted = true;
            localVideoRef.current.autoplay = true;
            localVideoRef.current.playsInline = true;

            try {
                await localVideoRef.current.play();
                console.log("Local video playing");
            } catch (err) {
                console.error("Play error:", err);
            }
        }

        if (navigator.mediaDevices.getDisplayMedia) {
            setScreenAvailable(true);
        }

        return stream;
    } catch (err) {
        console.error("getUserMedia Error:", err);
        setPermissionError(err.message);
        throw err;
    }
};
    const handleJoin = async (event) => {
        event.preventDefault();
        setPermissionError("");

        try {
            console.debug("handleJoin: requesting media and connecting socket");
            if (!streamRef.current) {
                await requestMediaPermissions();
            }

            if (!socketRef.current) {
                socketRef.current = io(`{server}`, {
                    transports: ["websocket"],
                });
                console.debug("Socket created (client)");
            }

            // ensure listeners are registered before emitting join so history/chat sent on join is received
            socketRef.current.off("chat-message", gotMessageFromServer);
            socketRef.current.off("user-joined");
            socketRef.current.off("signal");
            socketRef.current.off("user-disconnected");

            socketRef.current.on("chat-message", gotMessageFromServer);

            // fetch persisted history via API (in case server replay missed anything)
            (async () => {
                try {
                    const resp = await fetch(`${server}/api/v1/messages/${encodeURIComponent(location.pathname)}`);
                    if (resp.ok) {
                        const body = await resp.json();
                        if (body && body.messages) {
                            setChatMessages((prev) => [...prev, ...body.messages.map((m) => ({ data: m.data, sender: m.sender, socketIdSender: m.socketIdSender }))]);
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch message history:", err);
                }
            })();
            socketRef.current.on("user-joined", async (peerId) => {
                console.debug("user-joined -> starting call with", peerId);
                await startCallWithPeer(peerId);
            });
            socketRef.current.on("signal", async (fromId, message) => {
                console.debug("signal received from", fromId, message);
                await handlePeerSignal(fromId, message);
            });
            socketRef.current.on("user-disconnected", (peerId) => {
                const peerConnection = peerConnectionsRef.current[peerId];
                if (peerConnection) {
                    peerConnection.close();
                    delete peerConnectionsRef.current[peerId];
                }

                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = null;
                }
            });

            socketRef.current.emit("join-call", location.pathname);

            setAskForUsername(false);
        } catch (error) {
            console.error("Media permission error:", error);
            setPermissionError(error?.message || "Could not access camera or microphone.");
        }
    };

   
 
    useEffect(() => {
        checkPermissions().catch(() => {});
        return () => {
            if (socketRef.current) {
                socketRef.current.off("chat-message", gotMessageFromServer);
                socketRef.current.off("user-joined");
                socketRef.current.off("signal");
                socketRef.current.off("user-disconnected");
                socketRef.current.disconnect();
                socketRef.current = null;
            }

            Object.values(peerConnectionsRef.current).forEach((peerConnection) => {
                peerConnection.close();
            });
            peerConnectionsRef.current = {};

            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
        };
    }, []);

    return (
        <div className="video-meet-page">
            {askForUsername ? (
                <div className="video-meet-shell video-meet-shell--lobby">
                    <div className="video-meet-hero">
                        <div>
                            <p className="video-meet-kicker">Secure call lobby</p>
                            <h2>Enter into Lobby</h2>
                            <p className="video-meet-subtitle">
                                Prepare your camera, mic, and room connection before joining the call.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleJoin} className="video-meet-card video-meet-form">
                        <input
                            type="text"
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            placeholder="Enter your name"
                            aria-label="Enter your name"
                        />
                        <button type="submit" className="video-meet-primary-btn">Join</button>
                    </form>

                    <div className="video-meet-lobby-actions">
                        <button
                            type="button"
                            className="video-meet-secondary-btn"
                            onClick={handleEnableMedia}
                        >
                            Enable camera and mic
                        </button>
                        <button
                            type="button"
                            className="video-meet-secondary-btn"
                            onClick={async () => { await enumerateDevicesList(); await queryPermissionStates(); }}
                        >
                            Refresh devices
                        </button>
                        <button
                            type="button"
                            className="video-meet-secondary-btn"
                            onClick={handleScreenShareToggle}
                            disabled={!screenAvailable}
                        >
                            Preview screen share
                        </button>
                    </div>

                    <div className="video-meet-grid">
                        <div className="video-meet-card video-meet-preview">
                            <div className="video-meet-card-title">
                                <span>Live preview</span>
                                <span className="video-meet-status-dot">Ready</span>
                            </div>
                            
                            <video
    ref={localVideoRef}
    autoPlay
    playsInline
    muted
    style={{
        width: "500px",
        height: "300px",
        border: "3px solid red",
        backgroundColor: "black"
    }}
/>
                        </div>

                        <div className="video-meet-card video-meet-checklist">
                            <h3>Device selection</h3>
                            <label className="video-meet-field">
                                Camera
                                <select className="video-meet-select" value={selectedCameraId} onChange={(e) => setSelectedCameraId(e.target.value)}>
                                    {deviceList.filter((d) => d.kind === "videoinput").map((d) => (
                                        <option key={d.id} value={d.id}>{d.label}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="video-meet-field">
                                Microphone
                                <select className="video-meet-select" value={selectedMicrophoneId} onChange={(e) => setSelectedMicrophoneId(e.target.value)}>
                                    {deviceList.filter((d) => d.kind === "audioinput").map((d) => (
                                        <option key={d.id} value={d.id}>{d.label}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="video-meet-field">
                                Speaker
                                <select className="video-meet-select" value={selectedSpeakerId} onChange={(e) => setSelectedSpeakerId(e.target.value)}>
                                    {deviceList.filter((d) => d.kind === "audiooutput").map((d) => (
                                        <option key={d.id} value={d.id}>{d.label}</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="video-meet-card video-meet-debug">
                            <h4>Debug & Devices</h4>
                            <div style={{fontSize:12, color:'var(--video-muted)'}}>
                                <div>Camera permission: {permissionStates.camera}</div>
                                <div>Microphone permission: {permissionStates.microphone}</div>
                                <div style={{marginTop:8}}>
                                    <strong>Devices:</strong>
                                    <ul style={{margin:4, paddingLeft:18}}>
                                        {deviceList.length > 0 ? (
                                            deviceList.map((d) => (
                                                <li key={d.id}>{d.kind} — {d.label}</li>
                                            ))
                                        ) : (
                                            <li>(no devices listed)</li>
                                        )}
                                    </ul>
                                </div>
                                <div style={{marginTop:8}}>
                                    <button type="button" className="video-meet-secondary-btn" onClick={async () => { setPermissionError(''); await enumerateDevicesList(); await queryPermissionStates(); }}>Refresh devices</button>
                                </div>
                            </div>
                        </div>

                        <div className="video-meet-card video-meet-checklist">
                            <h3>Connection check</h3>

                            <div className="video-meet-checklist-item">
                                <span>Video permission</span>
                                <strong className={videoAvailable ? "video-meet-ok" : "video-meet-muted"}>
                                    {videoAvailable ? "Available" : "Not available"}
                                </strong>
                            </div>

                            <div className="video-meet-checklist-item">
                                <span>Audio permission</span>
                                <strong className={audioAvailable ? "video-meet-ok" : "video-meet-muted"}>
                                    {audioAvailable ? "Available" : "Not available"}
                                </strong>
                            </div>

                            <div className="video-meet-checklist-item">
                                <span>Screen share</span>
                                <strong className={screenAvailable ? "video-meet-ok" : "video-meet-muted"}>
                                    {screenAvailable ? "Available" : "Not available"}
                                </strong>
                            </div>

                            {permissionError ? <p className="video-meet-error">{permissionError}</p> : null}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="video-meet-shell video-meet-shell--room video-meet-shell--with-chat">
                    <div className="video-meet-room-header">
                        <div>
                            <p className="video-meet-kicker">Room connected</p>
                            <h2>Video Meet</h2>
                            <p className="video-meet-subtitle">Welcome, {username}.</p>
                        </div>
                        <div className="video-meet-room-header-actions">
                            <div className="video-meet-room-pill">Live connection</div>
                            <button
                                type="button"
                                className="video-meet-chat-toggle"
                                onClick={() => setChatOpen((previousState) => !previousState)}
                            >
                                {chatOpen ? "Hide chat" : "Open chat"}
                            </button>
                            <button type="button" className="video-meet-secondary-btn" onClick={silence} disabled={!audioAvailable}>
                                {micEnabled ? "Mute" : "Unmute"}
                            </button>
                            <button type="button" className="video-meet-secondary-btn" onClick={toggleCamera} disabled={!videoAvailable}>
                                {cameraEnabled ? "Stop camera" : "Start camera"}
                            </button>
                            <button type="button" className="video-meet-secondary-btn" onClick={hangUp}>
                                Leave
                            </button>
                        </div>
                    </div>

                    <div className="video-meet-stage">
                        <div className="video-meet-card video-meet-video-panel">
                            <div className="video-meet-card-title">
                                <span>Your camera</span>
                                <span
                                    className={
                                        micEnabled
                                            ? "video-meet-status-dot"
                                            : "video-meet-status-dot video-meet-status-dot--muted"
                                    }
                                >
                                    {micEnabled ? "Mic on" : "Mic off"}
                                </span>
                            </div>
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="video-meet-video video-meet-video--local"
                            />
                        </div>

                        <div className="video-meet-card video-meet-video-panel video-meet-video-panel--remote">
                            <div className="video-meet-card-title">
                                <span>Remote participant</span>
                                <span className="video-meet-status-dot">Connected</span>
                            </div>
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="video-meet-video video-meet-video--remote"
                            />
                        </div>
                    </div>

                    <div className="video-meet-controls">
                        <div className="video-meet-control-group">
                            <button
                                type="button"
                                onClick={silence}
                                disabled={!audioAvailable}
                                className="video-meet-secondary-btn"
                            >
                                {micEnabled ? "Silence" : "Unsilence"}
                            </button>

                            <button
                                type="button"
                                onClick={handleScreenShareToggle}
                                disabled={!screenAvailable}
                                className="video-meet-secondary-btn"
                            >
                                {screenSharing ? "Stop share" : "Share screen"}
                            </button>
                        </div>

                        <form onSubmit={addMessage} className="video-meet-message-form">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(event) => setNewMessage(event.target.value)}
                                placeholder="Type a message"
                                className="video-meet-input"
                                aria-label="Type a message"
                            />
                            <button type="submit" className="video-meet-primary-btn">
                                Send
                            </button>
                        </form>
                    </div>

                    <aside className={`video-meet-chat-drawer ${chatOpen ? "video-meet-chat-drawer--open" : ""}`}>
                        <div className="video-meet-chat-drawer-top">
                            <div>
                                <p className="video-meet-kicker">Chat room</p>
                                <h3>Messages</h3>
                            </div>
                            <button
                                type="button"
                                className="video-meet-chat-close"
                                onClick={() => setChatOpen(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="video-meet-chat-list">
                            {chatMessages.length > 0 ? (
                                chatMessages.map((message, index) => (
                                    <div className="video-meet-chat-item" key={`${message.socketIdSender}-${index}`}>
                                        <strong>{message.sender}</strong>
                                        <p>{message.data}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="video-meet-hint">No messages received yet.</p>
                            )}
                        </div>

                        <div className="video-meet-emoji-row">
                            {[
                                "😀",
                                "😂",
                                "😍",
                                "👍",
                                "🎉",
                                "❤️",
                                "🔥",
                                "🙏",
                            ].map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    className="video-meet-emoji-btn"
                                    onClick={() => appendEmoji(emoji)}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={addMessage} className="video-meet-chat-form">
                            <button
                                type="button"
                                className="video-meet-emoji-trigger"
                                onClick={() => setEmojiPickerOpen((previousState) => !previousState)}
                                aria-label="Toggle emoji picker"
                            >
                                😊
                            </button>

                            {emojiPickerOpen ? (
                                <div className="video-meet-emoji-popup">
                                    {[
                                        "😀",
                                        "😂",
                                        "😍",
                                        "👍",
                                        "🎉",
                                        "❤️",
                                        "🔥",
                                        "🙏",
                                    ].map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            className="video-meet-emoji-popup-btn"
                                            onClick={() => appendEmoji(emoji)}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            ) : null}

                            <input
                                type="text"
                                value={newMessage}
                                onChange={(event) => setNewMessage(event.target.value)}
                                placeholder="Write a message"
                                className="video-meet-input"
                                aria-label="Write a message"
                            />
                            <button type="submit" className="video-meet-primary-btn">
                                Send
                            </button>
                        </form>
                    </aside>
                </div>
            )}
        </div>
    );
}
