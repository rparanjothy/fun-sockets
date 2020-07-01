## RACEDAY GUID TICKER APP

### What this does?

1. Listens to a given kafka topic
2. pushes an objet into Mongo upon reciept of a kafka message {guid,crt_ts,topic,\_id}
3. Serves as a WebSocket Server and pushes latest 10 guids to clients every 2 seconds

### How to run?

docker container run -it --rm \
 --name guid-chaser-test \
 -p9001:8080 \
 -e RACEDAY_TOPIC=staging.unstructured.binary.cooked,staging.unstructured.csv.cooked,staging.unstructured.text.cooked,staging.unstructured.logs.cooked,staging.unstructured.json.cooked,staging.timeseries.merged-daqlog.raw \
 -e UPSERT_URL=http://raceday-staging.sppo:30000/teams/create \
 -e FETCH_URL=http://raceday-staging.sppo:30000/teams/listinfo \
 -e RETRIEVE_URL=http://raceday-staging.sppo:30000/teams/retrieve \
 -e KAFKA_BROKERS=raceday-staging.sppo:9092 \
 -e FROMBEGIN=1 \
 -e APPID=guid-chaser-test \
 sppogit.amd.com:5005/rparanjo/guid-ticker-api:dashboard

### Container Envs to set

RACEDAY_TOPIC = staging.timeseries.daqlog.raw

UPSERT_URL = http://raceday-staging.sppo:30000/teams/upsert/

FETCH_URL = http://raceday-staging.sppo:30000/teams/listinfo

RETRIEVE_URL="http://raceday-staging.sppo:30000/teams/retrieve"

KAFKA_BROKERS = raceday-staging.sppo:9092

FROMBEGIN = 1/0

APPID=pdat-dashboard

### Dependencies

1. A Mongo Container needs to be running

### TO DO

1. For TimeSeries/1-Many messages, GUIDs needs to be deduped..

## PDAT Dashboard Version

docker container run -it --rm \
 --name guid-chaser-test \
 -e RACEDAY_TOPIC=staging.test.dgemm-tw.cooked,staging.test.hpl.cooked,staging.testseries.specrate2006fp.cooked,staging.testseries.specrate2006int.cooked,staging.testseries.specrate2017fp.cooked,staging.testseries.specrate2017int.cooked,staging.testseries.specspeed2006fp.cooked,staging.testseries.specspeed2006int.cooked,staging.testseries.specspeed2017fp.cooked,staging.testseries.specspeed2017int.cooked \
 -e UPSERT_URL=http://raceday-staging.sppo:30000/teams/create \
 -e FETCH_URL=http://raceday-staging.sppo:30000/teams/listinfo \
 -e RETRIEVE_URL=http://raceday-staging.sppo:30000/teams/retrieve \
 -e KAFKA_BROKERS=raceday-staging.sppo:9092 \
 -e FROMBEGIN=1 \
 -e APPID=guid-chaser-test \
 sppogit.amd.com:5005/rparanjo/guid-ticker-api:dashboard
