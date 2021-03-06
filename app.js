const log = (m) => console.log(m);

log("Hi");

const path = require("path");
const http = require("http");
const express = require("express");
const socketIO = require("socket.io");

const expressServer = express();

expressServer.use(express.static("./client/"));

const httpServer = http.createServer(expressServer);
const socketServer = socketIO(httpServer);

expressServer.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "./client/index.html"))
);

socketServer.on("connection", (s) => {
  const msg = [s.id, "joined!"].join(" ");
  s.emit("msg", "welcome !! ");
  socketServer.emit("msg", msg);
  s.on("reply", (reply) => socketServer.emit("chat", reply));
});

httpServer.listen(process.env.PORT || 8080, () => log("Server Started!!"));
