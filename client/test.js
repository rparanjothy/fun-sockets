let ccx = () => {
  let w = new WebSocket("ws://127.0.0.1:8080");
  w.onopen = (e) => console.log(e);
  w.onmessage = (m) => console.log(JSON.parse(m.data));
};

let ccx = () => {
  let w = new WebSocket("ws://atlraceprd05:9001");
  // w.onopen = (e) => console.log(e);
  w.onmessage = (m) => {
    console.log(JSON.parse(m.data));
    const ll = document.createElement("div");

    ll.id = "guid-list";

    const mv = document.querySelector("#user-content");
    mv.innerHTML = "";
    mv.style.display = "flex";

    mv.style.justifyContent = "center";

    // console.log(mv);

    const d = JSON.parse(m.data);
    d.forEach((g) => {
      const aGuid = document.createElement("div");
      aGuid.style.margin = "5px";

      aGuid.style.padding = "10px";
      aGuid.style.textAlign = "center";

      aGuid.innerHTML = `<a href='http://atlraceprd05:9000/guid/${g.guid}'>${g.guid}</a>`;

      ll.appendChild(aGuid);
    });
    mv.appendChild(ll);
  };
};
ccx();
