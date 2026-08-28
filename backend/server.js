import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

import {
  CreateRoom,
  getRoom,
  addParticipant,
  updateVideo
} from "./room/roomManager.js";

const app = express();

app.use(cors());
app.use(express.json());

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});
//ek helper function hume yeha pe add karna hai
function extractVideoId(url) {
  try {
    const parsedUrl = new URL(url);

    // https://www.youtube.com/watch?v=VIDEO_ID
    if (parsedUrl.hostname.includes("youtube.com")) {
      return parsedUrl.searchParams.get("v");
    }

    // https://youtu.be/VIDEO_ID
    if (parsedUrl.hostname === "youtu.be") {
      return parsedUrl.pathname.slice(1);
    }

    return null;
  } catch {
    return null;
  }
}



// Create a new room
app.post("/api/rooms", (req, res) => {
  const room = CreateRoom();

  res.status(201).json({
    message: "Room created successfully",
    room: room,
  });
});

// Get room details
app.get("/api/rooms/:roomId", (req, res) => {
  const { roomId } = req.params;

  const room = getRoom(roomId);

  if (!room) {
    return res.status(404).json({
      message: "Room not found",
    });
  }

  res.json(room);
});

// Join an existing room
app.post("/api/rooms/:roomId/join", (req, res) => {
  const { roomId } = req.params;
  const { username, userId } = req.body;

  if (!username || !userId) {
    return res.status(400).json({
      message: "Username and userId are required",
    });
  }

  const result = addParticipant(roomId, username, userId);

  if (!result) {
    return res.status(404).json({
      message: "Room not found",
    });
  }

  // Send updated participant list to all users in this Socket.IO room
  io.to(roomId).emit(
    "participants-updated",
    result.room.participants
  );

  res.status(200).json({
    message: "Joined room successfully",
    room: result.room,
    participant: result.participant,
  });
});
 // ek aur api mai nahi janta eska kya kam  ahi
 app.post("/api/rooms/:roomId/video", (req, res) => {
  const { roomId } = req.params;
  const { videoUrl } = req.body;

  if (!videoUrl) {
    return res.status(400).json({
      message: "Video URL is required",
    });
  }

  const videoId = extractVideoId(videoUrl);

  if (!videoId) {
    return res.status(400).json({
      message: "Invalid YouTube URL",
    });
  }

  const room = updateVideo(roomId, videoId);

  if (!room) {
    return res.status(404).json({
      message: "Room not found",
    });
  }

  // Real-time update to everyone in this room
  io.to(roomId).emit("video-updated", {
    videoId: room.videoId,
    currentTime: room.currentTime,
    isPlaying: room.isPlaying,
  });

  res.json({
    message: "Video updated successfully",
    room,
  });
});
// Socket connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);

    console.log(
      `User ${socket.id} joined room ${roomId}`
    );
  });

  socket.on(
    "play-video",
    ({ roomId, currentTime }) => {
      socket.to(roomId).emit(
        "play-video",
        {
          currentTime,
        }
      );
    }
  );

  socket.on(
    "pause-video",
    ({ roomId, currentTime }) => {
      socket.to(roomId).emit(
        "pause-video",
        {
          currentTime,
        }
      );
    }
  );

  socket.on("leave-room", (roomId) => {
    socket.leave(roomId);

    console.log(
      `User ${socket.id} left room ${roomId}`
    );
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
const PORT = 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});