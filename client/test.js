let ccx = () => {
  let w = new WebSocket("ws://127.0.0.1:8080");
  w.onopen = (e) => console.log(e);
  w.onmessage = (m) => console.log(JSON.parse(m.data));
};

let ccx = () => {
  let w = new WebSocket("ws://raceday-staging.sppo:9001");
  // w.onopen = (e) => console.log(e);
  w.onmessage = (m) => {
    console.log(JSON.parse(m.data));
    const ll = document.createElement("div");

    ll.id = "guid-list";

    const mv = document.querySelector("#user-content");
    mv.style.display = "flex";

    mv.style.justifyContent = "center";

    // console.log(mv);
    mv.innerHTML = "";
    const d = JSON.parse(m.data);
    d.forEach((g) => {
      const aGuid = document.createElement("div");
      aGuid.style.margin = "5px";

      aGuid.style.padding = "10px";
      aGuid.style.textAlign = "center";

      aGuid.innerText = g.guid;
      ll.appendChild(aGuid);
    });
    mv.appendChild(ll);
  };
};
ccx();
