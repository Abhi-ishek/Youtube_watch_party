import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const [username, setUsername] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Create a new room
  const createRoom = async () => {
    if (!username.trim()) {
      alert("Please enter your name");
      return;
    }

    try {
      setLoading(true);

      // 1. Create room
      const response = await fetch(
        "http://localhost:5000/api/rooms",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      const roomId = data.room.roomId;

      // 2. Generate user ID
      const userId = crypto.randomUUID();

      // 3. Join created room as Host
      const joinResponse = await fetch(
        `http://localhost:5000/api/rooms/${roomId}/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            userId,
          }),
        }
      );

      if (!joinResponse.ok) {
        throw new Error("Unable to join room");
      }

      // 4. Save user information
      localStorage.setItem(
        `user-${roomId}`,
        JSON.stringify({
          username,
          userId,
        })
      );

      // 5. Navigate to room
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error("Error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Join an existing room
  const joinRoom = async () => {
    if (!username.trim()) {
      alert("Please enter your name");
      return;
    }

    if (!joinRoomId.trim()) {
      alert("Please enter Room ID");
      return;
    }

    try {
      setLoading(true);

      const userId = crypto.randomUUID();

      const response = await fetch(
        `http://localhost:5000/api/rooms/${joinRoomId.toUpperCase()}/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          }, 
          body: JSON.stringify({
            username,
            userId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to join room");
      }

      // Save this user's information for this room
      localStorage.setItem(
        `user-${joinRoomId.toUpperCase()}`,
        JSON.stringify({
          username,
          userId,
        })
      );

      navigate(`/room/${joinRoomId.toUpperCase()}`);
    } catch (error) {
      console.error("Error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>YouTube Watch Party</h1>

      <hr />

      <h3>Your Name</h3>

      <input
        type="text"
        placeholder="Enter your name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <br />
      <br />

      <button onClick={createRoom} disabled={loading}>
        {loading ? "Please wait..." : "Create Room"}
      </button>

      <hr />

      <h3>Join Existing Room</h3>

      <input
        type="text"
        placeholder="Enter Room ID"
        value={joinRoomId}
        onChange={(e) => setJoinRoomId(e.target.value)}
      />

      <br />
      <br />

      <button onClick={joinRoom} disabled={loading}>
        {loading ? "Joining..." : "Join Room"}
      </button>
    </div>
  );
}

export default Home;