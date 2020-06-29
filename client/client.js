const sock = io();

const chatter = prompt("you go by?", "User1");

sock.on("msg", (s) => {
  const msges = document.getElementById("messages");
  const newMsg = document.createElement("div");
  newMsg.className = "newMsg";
  newMsg.innerHTML = s;
  msges.appendChild(newMsg);
});

sock.on("chat", (s) => {
  const msges = document.getElementById("messages");
  const newMsgPod = document.createElement("div");
  const newMsg = document.createElement("div");
  const newMsgFrom = document.createElement("div");
  newMsgPod.appendChild(newMsgFrom);
  newMsgFrom.className = "newMsgFrom";
  newMsgPod.appendChild(newMsg);
  newMsgPod.className = "newMsgPod";
  const d = s.split(":");
  const [from, msg] = d;
  newMsg.innerHTML = msg;
  newMsgFrom.innerHTML = from;
  msges.appendChild(newMsgPod);
});

const onSubmit = (e) => {
  sock.emit("reply", `${chatter}:${e.target.value}`);
  e.target.value = "";
};

document.getElementById("token").addEventListener("change", onSubmit);
