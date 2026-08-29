import socket from "../socket";

import { use, useEffect, useRef } from "react";

function YouTubePlayer({ videoId ,roomId, isHost }) {
  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const isSyncingRef= useRef(false);

useEffect(() => {
  const handlePlayVideo = ({ currentTime }) => {
    if (!playerRef.current) return;

    isSyncingRef.current = true;

    playerRef.current.seekTo(
      currentTime,
      true
    );

    playerRef.current.playVideo();
  };

  const handlePauseVideo = ({ currentTime }) => {
    if (!playerRef.current) return;

    isSyncingRef.current = true;

    playerRef.current.seekTo(
      currentTime,
      true
    );

    playerRef.current.pauseVideo();
  };

  socket.on("play-video", handlePlayVideo);
  socket.on("pause-video", handlePauseVideo);

  return () => {
    socket.off(
      "play-video",
      handlePlayVideo
    );

    socket.off(
      "pause-video",
      handlePauseVideo
    );
  };
}, []);


  useEffect(() => {
    if (!videoId) return;

    const createPlayer = () => {
      // Agar player pehle se exist karta hai
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      playerRef.current = new window.YT.Player(
        playerContainerRef.current,
        {
          height: "390",
          width: "640",

          videoId: videoId,

          playerVars: {
            autoplay: 0,
            controls: 1,
          },

          events: {
            onReady: () => {
              console.log("YouTube Player Ready");
            },

           onStateChange: (event) => {
  console.log(
    "YouTube Player State:",
    event.data
  );

  // Agar synchronization ki wajah se state change hui hai
  if (isSyncingRef.current) {
    isSyncingRef.current = false;
    return;
  }

  // Sirf Host events broadcast karega
  if (!isHost) return;

  const currentTime =
    playerRef.current.getCurrentTime();

  // PLAY
  if (
    event.data === window.YT.PlayerState.PLAYING
  ) {
    socket.emit("play-video", {
      roomId,
      currentTime,
    });
  }

  // PAUSE
  if (
    event.data === window.YT.PlayerState.PAUSED
  ) {
    socket.emit("pause-video", {
      roomId,
      currentTime,
    });
  }
},
          },
        }
      );
    };

    // Check whether YouTube API is already loaded
    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      // Check whether script already exists
      const existingScript = document.getElementById(
        "youtube-iframe-api"
      );

      if (!existingScript) {
        const tag = document.createElement("script");

        tag.id = "youtube-iframe-api";
        tag.src =
          "https://www.youtube.com/iframe_api";

        document.body.appendChild(tag);
      }

      window.onYouTubeIframeAPIReady = () => {
        createPlayer();
      };
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId]);

  return (
    <div>
      <div ref={playerContainerRef}></div>
    </div>
  );
}

export default YouTubePlayer;
