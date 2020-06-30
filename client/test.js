let ccx = () => {
  let w = new WebSocket("ws://127.0.0.1:8080");
  w.onopen = (e) => console.log(e);
  w.onmessage = (m) => console.log(JSON.parse(m.data));
};
