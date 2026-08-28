import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import YouTubePlayer from "../components/YouTubePlayer.jsx";
import socket from "../socket";

function Room() {
  const { roomId } = useParams();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  // Get current user's data from localStorage
  const userData = JSON.parse(
    localStorage.getItem(`user-${roomId}`)
  );

  // IMPORTANT: Define currentUserId first
  const currentUserId = userData?.userId;

  // Then find current user
  const currentUser = room?.participants.find(
    (participant) =>
      participant.userId === currentUserId
  );

  // Check whether current user is host
  const isHost = currentUser?.role === "host";

  // Set YouTube video
  const setVideo = async () => {
    if (!videoUrl.trim()) {
      alert("Please enter a YouTube URL");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/rooms/${roomId}/video`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            videoUrl,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setVideoUrl("");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  // Listen for participant updates
  useEffect(() => {
    const handleParticipantsUpdate = (participants) => {
      setRoom((currentRoom) => {
        if (!currentRoom) return currentRoom;

        return {
          ...currentRoom,
          participants: participants,
        };
      });
    };

    socket.on(
      "participants-updated",
      handleParticipantsUpdate
    );

    return () => {
      socket.off(
        "participants-updated",
        handleParticipantsUpdate
      );
    };
  }, []);

  // Join Socket.IO room
  useEffect(() => {
    socket.emit("join-room", roomId);

    return () => {
      socket.emit("leave-room", roomId);
    };
  }, [roomId]);

  // Listen for video updates
  useEffect(() => {
    const handleVideoUpdate = (videoData) => {
      setRoom((currentRoom) => {
        if (!currentRoom) return currentRoom;

        return {
          ...currentRoom,
          videoId: videoData.videoId,
          currentTime: videoData.currentTime,
          isPlaying: videoData.isPlaying,
        };
      });
    };

    socket.on("video-updated", handleVideoUpdate);

    return () => {
      socket.off("video-updated", handleVideoUpdate);
    };
  }, []);

  // Fetch room data
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/rooms/${roomId}`
        );

        if (!response.ok) {
          throw new Error("Room not found");
        }

        const data = await response.json();

        setRoom(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  if (loading) {
    return <h2>Loading room...</h2>;
  }

  if (error) {
    return <h2>{error}</h2>;
  }

  return (
    <div>
      <h1>YouTube Watch Party</h1>

      <h2>Watch Party Room</h2>

      <p>
        Room ID: <strong>{room.roomId}</strong>
      </p>

      {/* Only Host can set the video */}
      {isHost && (
        <div>
          <h3>Set YouTube Video</h3>

          <input
            type="text"
            placeholder="Paste YouTube URL"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />

          <button onClick={setVideo}>
            Set Video
          </button>
        </div>
      )}

      <p>
        Video: {room.videoId || "No video selected"}
      </p>

      {room.videoId ? (
        <YouTubePlayer
  videoId={room.videoId}
  roomId={roomId}
  isHost={isHost}
/>
      ) : (
        <p>No video selected yet</p>
      )}

      <p>
        Status: {room.isPlaying ? "Playing" : "Paused"}
      </p>

      <p>
        Participants: {room.participants.length}
      </p>

      <h3>Participants</h3>

      {room.participants.map((participant) => (
        <div key={participant.userId}>
          <strong>{participant.username}</strong>
          {" - "}
          {participant.role}
        </div>
      ))}
    </div>
  );
}

export default Room;
