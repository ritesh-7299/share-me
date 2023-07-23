import { Button, Typography } from "@mui/material";
import { CentralizedCard } from "./CentralizedCard";
import { useEffect, useState } from "react";
import socketIO from "socket.io-client";

const createOffer = async () => {
  const localConnection = new RTCPeerConnection();
  localConnection.onicecandidate = (e) => {
    console.log(" NEW ice candidate!! on localconnection reprinting SDP ");
    console.log(JSON.stringify(localConnection.localDescription));
    localStorage.setItem(
      "signalId",
      JSON.stringify(localConnection.localDescription)
    );
  };

  const sendChannel = localConnection.createDataChannel("sendChannel");
  sendChannel.onmessage = (e) => console.log("messsage received!!!" + e.data);
  sendChannel.onopen = (e) => console.log("open!!!!");
  sendChannel.onclose = (e) => console.log("closed!!!!!!");

  localConnection
    .createOffer()
    .then((o) => localConnection.setLocalDescription(o));

  return JSON.stringify(localConnection.localDescription);
};

export function MeetingPage() {
  const s = socketIO.connect("http://localhost:3000");
  const [openConnection, setOpenConnection] = useState(false);
  const [signalId, setSignalId] = useState(null);
  const [socket, setSocket] = useState(null);

  const handleSend = async () => {
    const offer = await createOffer();
    setSignalId(offer);
    localStorage.setItem("signalId", offer);
    setOpenConnection(true);
  };
  useEffect(() => {
    console.log("socket", socket);
  }, [socket]);

  return (
    <div style={{ minHeight: "100vh" }}>
      <CentralizedCard>
        <div>
          <Typography textAlign={"center"} variant="h5">
            Hi welcome to share-me
          </Typography>
          <Typography>{signalId ? "signalId" : "No signal found!"}</Typography>
        </div>
        <br />
        <br />
        <div style={{ display: "flex", justifyContent: "center" }}>
          {!openConnection && (
            <Button variant="contained" onClick={handleSend}>
              Send File
            </Button>
          )}
        </div>
      </CentralizedCard>
    </div>
  );
}
