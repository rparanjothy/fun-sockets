//  Author: Ram Paranjothy
//  June 2020
//  AMD, Austin, TX

const log = (m) => console.log(m);

const axios = require("axios");

const racedayTopic =
  process.env.RACEDAY_TOPIC || "staging.timeseries.daqlog.raw";

const upsertURL =
  process.env.UPSERT_URL || "http://raceday-staging.sppo:30000/teams/upsert";

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

const rdConsumer = kafkaClient.consumer({ groupId: "scrutineer" });

rdConsumer
  .subscribe({ topic: racedayTopic })
  .then(() => {
    log(`${racedayTopic}: subscribe OK`);
    rdConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const payload = JSON.parse(message.value.toString());

        log(`Current: ${payload.iteration_guid}`);
        axios
          .post(`${upsertURL}/${payload.iteration_guid}`, {
            crt_ts: Date.now(),
            topic: topic,
            guid: payload.iteration_guid,
          })
          .then((res) => res.data)
          .then((res) => {
            console.log(res);
          })
          .catch((ex) => {
            console.log("Err" + ex);
          });
      },
    });
  })
  .catch((e) => log(`Error: ${e} - ${racedayTopic}`));

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
