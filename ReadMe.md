## RACEDAY GUID TICKER APP

### What this does?

1. Listens to a given kafka topic
2. pushes an objet into Mongo upon reciept of a kafka message {guid,crt_ts,topic,\_id}
3. Serves as a WebSocket Server and pushes latest 10 guids to clients every 2 seconds

### How to run?

docker container run -it --rm --name guid-server -p9001:8080 -e RACEDAY_TOPIC=staging.timeseries.daqlog.raw -e UPSERT_URL=http://raceday-staging.sppo:30000/teams/create -e FETCH_URL=http://raceday-staging.sppo:30000/teams/listinfo -e KAFKA_BROKERS=raceday-staging.sppo:9092 sppogit.amd.com:5005/rparanjo/guid-ticker-api:latest

### Container Envs to set

RACEDAY_TOPIC = staging.timeseries.daqlog.raw

UPSERT_URL = http://raceday-staging.sppo:30000/teams/upsert/

FETCH_URL = http://raceday-staging.sppo:30000/teams/listinfo

KAFKA_BROKERS = raceday-staging.sppo:9092

### Dependencies

1. A Mongo Container needs to be running

### TO DO

1. For TimeSeries/1-Many messages, GUIDs needs to be deduped..
