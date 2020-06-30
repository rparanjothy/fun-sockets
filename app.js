//  Author: Ram Paranjothy
//  June 2020
//  AMD, Austin, TX

const log = (m) => console.log(m);
const error = (m) => console.error(m);

const axios = require("axios");

const racedayTopic =
  process.env.RACEDAY_TOPIC ||
  "staging.timeseries.merged-daqlog.raw,staging.unstructured.text.cooked";

const upsertURL =
  process.env.UPSERT_URL || "http://raceday-staging.sppo:30000/teams/create";

const fetchURL =
  process.env.FETCH_URL || "http://raceday-staging.sppo:30000/teams/listinfo";

const kafkaBrokers = process.env.KAFKA_BROKERS || "raceday-staging.sppo:9092";

const http = require("http");

const webSocket = require("websocket");

const { Kafka } = require("kafkajs");

// get a http server instance
const httpServer = http.createServer();

const kafkaClient = new Kafka({
  clientId: "guid-ticker",
  brokers: [kafkaBrokers],
});

const rdConsumer = kafkaClient.consumer({ groupId: "guid-chaser" });

racedayTopic.split(",").forEach((tpic) => {
  log(tpic);
  rdConsumer
    .subscribe({ topic: tpic })
    .then(() => {
      log(`[INFO] >>> ${tpic}: subscribe OK`);
      rdConsumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const payload = JSON.parse(message.value.toString());
          let incomingGuid;

          if (topic.includes("unstructured")) {
            incomingGuid = payload.guid;
          } else {
            incomingGuid = payload.iteration_guid;
          }

          incomingGuid &&
            axios
              .post(`${upsertURL}/${incomingGuid}`, {
                crt_ts: Date.now(),
                topic: topic,
                guid: incomingGuid,
              })
              .then((res) => log(res.data))
              .catch((ex) => {
                const exRet = ex.response.data;
                log(
                  `[ERROR] >>> GUID: ${exRet._id} >>> msg: ${exRet.msg} >>> code: ${exRet.err_code}`
                );
              });
        },
      });
    })
    .catch((e) => log(`Error: ${e} - ${racedayTopic}`));
});

// wrap the websocker server on top of http server
const webSocketServer = new webSocket.server({ httpServer: httpServer });

webSocketServer.on("request", (r) => {
  const conn = r.accept();
  // Now broadcast ecry 5 sec
  setInterval(() => {
    fetchGuids()
      .then((latest10Guids) => {
        conn.send(JSON.stringify(latest10Guids), () => {});
      })
      .catch((ex) =>
        conn.send(
          JSON.stringify({ msg: `Error Fetching from Raceday - ${ex}` })
        )
      );
  }, 2000);
});

async function fetchGuids() {
  // get from DB and send
  return await axios
    .get(fetchURL)
    .then((res) => {
      if (res.data.data.length > 1) {
        return res.data.data
          .filter((i) => i._id === i.guid)
          .sort((a, b) => {
            if (a.crt_ts > b.crt_ts) {
              return -1;
            }
            if (a.crt_ts < b.crt_ts) {
              return 1;
            }
            if ((a.crt_ts = b.crt_ts)) {
              return 0;
            }
          })
          .slice(0, 10);
      } else {
        return res.data.data;
      }
    })
    .catch((ex) => ex);
}

httpServer.listen(8080);
