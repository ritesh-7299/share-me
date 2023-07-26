import React, { useState } from "react";
import { CentralizedCard } from "../components/CentralizedCard";
import { Divider, Typography, Button, Grid, TextField } from "@mui/material";
import socketIO from "socket.io-client";

//create an offer for webrtc
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

//Accept an offer
const acceptOffer = async (offer) => {
  //set offer const offer = ...
  const remoteConnection = new RTCPeerConnection();

  remoteConnection.onicecandidate = (e) => {
    console.log(" NEW ice candidnat!! on localconnection reprinting SDP ");
    console.log(JSON.stringify(remoteConnection.localDescription));
  };

  remoteConnection.ondatachannel = (e) => {
    const receiveChannel = e.channel;
    receiveChannel.onmessage = (e) =>
      console.log("messsage received!!!" + e.data);
    receiveChannel.onopen = (e) => console.log("open!!!!");
    receiveChannel.onclose = (e) => console.log("closed!!!!!!");
    remoteConnection.channel = receiveChannel;
  };

  remoteConnection.setRemoteDescription(offer).then((a) => console.log("done"));

  //create answer
  await remoteConnection
    .createAnswer()
    .then((a) => remoteConnection.setLocalDescription(a))
    .then((a) =>
      console.log(JSON.stringify(remoteConnection.localDescription))
    );
  //send the anser to the client
};

export default function Home() {
  const socket = socketIO.connect("http://localhost:3000");
  const [isSend, setIsSend] = useState(false);
  const [isReceive, setIsReceive] = useState(false);
  const [signalId, setSignalId] = useState(null);
  const [code, setCode] = useState(Date.now().toString().slice(-4));
  const [joiningCode, setJoiningCode] = useState(null);

  const handleSend = async () => {
    setIsSend(true);
    setIsReceive(false);
    const offer = await createOffer();
    setSignalId(offer);
    localStorage.setItem("signalId", offer);
    socket.emit("createRoom", code);
  };

  const handleReceive = async () => {
    setIsReceive(true);
    setIsSend(false);
    socket.emit("createRoom", joiningCode, "joiner");
  };
  //check for errors in joining room
  socket.on("joiningError", (msg) => alert(msg));

  //send signal
  socket.on("joined", () => {
    socket.emit("sendSignal", code, localStorage.getItem("signalId"));
  });

  //receive signal
  socket.on("receiveSignal", async (data) => {
    console.log("This is calling");
    console.log(data);
    await acceptOffer(data);
  });

  return (
    <CentralizedCard>
      <Typography textAlign={"center"} variant="h5">
        Hi welcome to share-me
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Grid
        container
        spacing={2}
        direction="row"
        justifyContent="center"
        alignItems="center"
        alignContent="center"
        wrap="wrap"
        sx={{ mt: 1 }}
      >
        <Grid item xs={12}>
          {isSend && (
            <TextField
              id="secret"
              label="Please share this code to your receiver"
              value={code}
              fullWidth
              disabled
            />
          )}
          {isReceive && (
            <TextField
              id="secret"
              label="Please enter the code to receive files"
              fullWidth
              value={joiningCode}
              onChange={(e) => {
                setJoiningCode(e.target.value);
              }}
            />
          )}
        </Grid>
        <Grid item>
          <Button onClick={handleSend} variant="contained" color="primary">
            Send
          </Button>
        </Grid>
        <Grid item>
          <Button onClick={handleReceive} variant="contained" color="secondary">
            Receive
          </Button>
        </Grid>
      </Grid>
    </CentralizedCard>
  );
}
