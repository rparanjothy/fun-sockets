const sock = io();

sock.on("msg", (s) => {
  const msges = document.getElementById("messages");
  const newMsg = document.createElement("div");
  newMsg.className = "newMsg";
  newMsg.innerHTML = s;
  msges.appendChild(newMsg);
});
