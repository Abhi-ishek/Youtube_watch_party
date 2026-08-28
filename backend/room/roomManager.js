const rooms={};

 function generateRoomId(){
    return Math.random().toString(36).substring(2, 8).toUpperCase();    

 }
  function CreateRoom(){
     const roomId=generateRoomId();
      
     const room={
        roomId:roomId,
        videoId:null,
        currentTime:0,
        isPlaying:false,
        participants:[],
     };
      rooms[roomId]=room;
      return room;

  }
   function getRoom(roomId){
      return rooms[roomId];
   }

   function updateVideo(roomId, videoId) {
  const room = rooms[roomId];

  if (!room) {
    return null;
  }

  room.videoId = videoId;
  room.currentTime = 0;
  room.isPlaying = false;

  return room;
}


function addParticipant(roomId, username, userId) {
  const room = rooms[roomId];

  if (!room) {
    return null;
  }

  const role =
    room.participants.length === 0
      ? "host"
      : "participant";

  const participant = {
    userId,
    username,
    role,
  };

  room.participants.push(participant);

  return {
    room,
    participant,
  };
}


export  {
    CreateRoom,
    getRoom,
     addParticipant,
     updateVideo,
   }