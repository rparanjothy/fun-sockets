//  Author: Ram Paranjothy
//  June 2020
//  AMD, Austin, TX

const log = (m) => console.log(m);

const axios = require("axios");

const racedayTopic =
  process.env.RACEDAY_TOPIC ||
  "staging.test.dgemm-tw.cooked,staging.test.hpl.cooked,staging.testseries.specrate2006fp.cooked,staging.testseries.specrate2006int.cooked,staging.testseries.specrate2017fp.cooked,staging.testseries.specrate2017int.cooked,staging.testseries.specspeed2006fp.cooked,staging.testseries.specspeed2006int.cooked,staging.testseries.specspeed2017fp.cooked,staging.testseries.specspeed2017int.cooked";

const appID = process.env.APPID || "pdat-summary";

const upsertURL =
  process.env.UPSERT_URL || "http://raceday-staging.sppo:30000/teams/create";

const frmBeginningFlag = process.env.FROMBEGIN || 1;

console.log(frmBeginningFlag);
console.log(Boolean(parseInt(frmBeginningFlag)));

const retrieveURL =
  process.env.RETRIEVE_URL ||
  "http://raceday-staging.sppo:30000/teams/retrieve";

const fetchURL =
  process.env.FETCH_URL || "http://raceday-staging.sppo:30000/teams/listinfo";

const kafkaBrokers = process.env.KAFKA_BROKERS || "raceday-staging.sppo:9092";

const { Kafka } = require("kafkajs");

const kafkaClient = new Kafka({
  clientId: appID,
  brokers: kafkaBrokers.split(","),
});

const rdConsumer = kafkaClient.consumer({ groupId: appID });

const sync = (iterGuid, incomingPayload, tpic, lbl) => {
  incomingPayload["ld_ts"] = new Date();
  incomingPayload["upd_ts"] = Date.now();

  const currentTopicObj = {};

  currentTopicObj["data"] = incomingPayload;
  currentTopicObj["type"] = lbl;

  const objUpdated = { ...currentTopicObj };

  !iterGuid && log(`[ERROR] >>> GUID: ${iterGuid} >>> topic: ${tpic} `);

  iterGuid &&
    axios
      .post(`${upsertURL}/${iterGuid}`, objUpdated)
      .then((res) =>
        log(
          `[SUCCESS] >>> GUID: ${iterGuid} >>> topic: ${tpic} >>> ${new Date()}`
        )
      )
      .catch((ex) => {
        const exRet = ex.response.data;
        log(
          `[API ERROR] >>> GUID: ${exRet._id} >>> msg: ${exRet.msg} >>> code: ${exRet.err_code}`
        );
      });
};

racedayTopic.split(",").forEach((tpic) => {
  log(tpic);
  rdConsumer
    .subscribe({
      topic: tpic,
      fromBeginning: Boolean(parseInt(frmBeginningFlag)),
    })
    .then(() => {
      log(`[INFO] >>> ${tpic}: subscribe OK`);
      rdConsumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const kafkaMsgtime = new Date(parseInt(message.timestamp));
          const payloadRaw = JSON.parse(message.value.toString());

          const { sut_dimensions } = payloadRaw;

          // default s1
          const sut_dimensionsFixed = {
            ...sut_dimensions,
            socket: [...sut_dimensions.socket, { iod: { serial_number: "-" } }],
          };

          const payload = {
            ...payloadRaw,
            sut_dimensions: sut_dimensionsFixed,
          };

          // log(tpic);
          // log(payloadRaw);
          // log(Object.keys(payloadRaw));

          if (Object.keys(payloadRaw).includes("dgemm_tw")) {
            // log("DGEMM");
            incomingPayload = {
              msg_ts: kafkaMsgtime,
              iteration_guid: payload.test_dimensions.iteration_guid,
              iteration_name: payload.test_dimensions.iteration_name,
              test_name: payload.test_dimensions.test_name,
              bios_name: payload.system_configuration.bios.bios_name,
              s0_serial_number:
                payload.sut_dimensions.socket[0].iod.serial_number,
              s1_serial_number:
                payload.sut_dimensions.socket[1].iod.serial_number,
              // peak_mflops: payload.dgemm_tw.peak_mflops,
            };

            // // fetch by _id = "iteration_name"
            // url = [retrieveURL, payload.test_dimensions.iteration_name].join(
            //   "/"
            // );

            sync(
              payload.test_dimensions.iteration_guid,
              incomingPayload,
              tpic,
              "DGEMM"
            );
          } else if (Object.keys(payloadRaw).includes("HPL")) {
            // log("hpl");

            incomingPayload = {
              msg_ts: kafkaMsgtime,

              iteration_guid: payload.test_dimensions.iteration_guid,
              iteration_name: payload.test_dimensions.iteration_name,
              test_name: payload.test_dimensions.test_name,
              bios_name: payload.system_configuration.bios.bios_name,
              s0_serial_number:
                payload.sut_dimensions.socket[0].iod.serial_number,
              s1_serial_number:
                payload.sut_dimensions.socket[1].iod.serial_number,
              // Gflops: payload.HPL.Gflops,
            };
            // // fetch by _id = "iteration_name"
            // url = [retrieveURL, payload.test_dimensions.iteration_name].join(
            //   "/"
            // );

            sync(
              payload.test_dimensions.iteration_guid,
              incomingPayload,
              tpic,
              "HPL"
            );
          } else if (Object.keys(payloadRaw).includes("SPECrate2006_fp")) {
            // log("SPECrate2006_fp");
            incomingPayload = {
              msg_ts: kafkaMsgtime,

              iteration_guid: payload.test_dimensions.iteration_guid,
              iteration_name: payload.test_dimensions.iteration_name,
              test_name: payload.test_dimensions.test_name,
              bios_name: payload.system_configuration.bios.bios_name,
              s0_serial_number:
                payload.sut_dimensions.socket[0].iod.serial_number,
              s1_serial_number:
                payload.sut_dimensions.socket[1].iod.serial_number,
              // mean: payload.SPECrate2006_fp.base.mean,
              // "_410_bwaves_.base.iterations0.ratio":
              //   payload.SPECrate2006_fp.results._410_bwaves_.base.iterations[0]
              //     .ratio,
              // "_416_gamess_.base.iterations0.ratio":
              //   payload.SPECrate2006_fp.results._416_gamess_.base.iterations[0]
              //     .ratio,
              // "_433_milc_.base.iterations0.ratio":
              //   payload.SPECrate2006_fp.results._433_milc_.base.iterations[0]
              //     .ratio,
              // "_434_zeusmp_.base.iterations0.ratio":
              //   payload.SPECrate2006_fp.results._434_zeusmp_.base.iterations[0]
              //     .ratio,
              // "_435_gromacs_.base.iterations0.ratio":
              //   payload.SPECrate2006_fp.results._435_gromacs_.base.iterations[0]
              //     .ratio,
              // "_436_cactusADM_.base.iterations0.ratio":
              //   payload.SPECrate2006_fp.results._436_cactusADM_.base
              //     .iterations[0].ratio,
              // "_437_leslie3d_.base.iterations0.ratio":
              //   payload.SPECrate2006_fp.results._437_leslie3d_.base
              //     .iterations[0].ratio,
              // "_444_namd_.base.iterations0.ratio":
              //   payload.SPECrate2006_fp.results._444_namd_.base.iterations[0]
              //     .ratio,
              // "_447_dealII_.base.iterations0.ratio":
              //   payload.SPECrate2006_fp.results._447_dealII_.base.iterations[0]
              //     .ratio,
              // "_450_soplex_.base.iterations0.ratio":
              //   payload.SPECrate2006_fp.results._450_soplex_.base.iterations[0]
              //     .ratio,
              // "_453_povray_.base.iterations0.ratio":
              //   payload.SPECrate2006_fp.results._453_povray_.base.iterations[0]
              //     .ratio,
              // "_454_calculix_.base.iterations0.ratio":
              //   payload.SPECrate2006_fp.results._454_calculix_.base
              //     .iterations[0].ratio,
              // "_459_GemsFDTD_.base.iterations0.ratio":
              //   payload.SPECrate2006_fp.results._459_GemsFDTD_.base
              //     .iterations[0].ratio,
              // "_465_tonto_.base.iterations0.ratio":
              //   payload.SPECrate2006_fp.results._465_tonto_.base.iterations[0]
              //     .ratio,
              // "_470_lbm_.base.iterations0.ratio":
              //   payload.SPECrate2006_fp.results._470_lbm_.base.iterations[0]
              //     .ratio,
              // "_481_wrf_.base.iterations0.ratio":
              //   payload.SPECrate2006_fp.results._481_wrf_.base.iterations[0]
              //     .ratio,
              // "_482_sphinx3_.base.iterations0.ratio":
              //   payload.SPECrate2006_fp.results._482_sphinx3_.base.iterations[0]
              //     .ratio,
            };
            // url = [retrieveURL, payload.test_dimensions.iteration_name].join(
            //   "/"
            // );

            sync(
              payload.test_dimensions.iteration_guid,
              incomingPayload,
              tpic,
              "SPECrate2006_fp"
            );
          } else if (Object.keys(payloadRaw).includes("SPECrate2006_int")) {
            // log("SPECrate2006_int");
            incomingPayload = {
              msg_ts: kafkaMsgtime,

              iteration_guid: payload.test_dimensions.iteration_guid,
              iteration_name: payload.test_dimensions.iteration_name,
              test_name: payload.test_dimensions.test_name,
              bios_name: payload.system_configuration.bios.bios_name,
              s0_serial_number:
                payload.sut_dimensions.socket[0].iod.serial_number,
              s1_serial_number:
                payload.sut_dimensions.socket[1].iod.serial_number,
              // mean: payload.SPECrate2006_int.base.mean,
              // "test_400_perlbench_.base.iterations0.ratio":
              //   payload.SPECrate2006_int.results.test_400_perlbench_.base
              //     .iterations[0].ratio,
              // "test_401_bzip2_.base.iterations0.ratio":
              //   payload.SPECrate2006_int.results.test_401_bzip2_.base
              //     .iterations[0].ratio,
              // "test_403_gcc_.base.iterations0.ratio":
              //   payload.SPECrate2006_int.results.test_403_gcc_.base
              //     .iterations[0].ratio,
              // "test_429_mcf_.base.iterations0.ratio":
              //   payload.SPECrate2006_int.results.test_429_mcf_.base
              //     .iterations[0].ratio,
              // "test_445_gobmk_.base.iterations0.ratio":
              //   payload.SPECrate2006_int.results.test_445_gobmk_.base
              //     .iterations[0].ratio,
              // "test_456_hmmer_.base.iterations0.ratio":
              //   payload.SPECrate2006_int.results.test_456_hmmer_.base
              //     .iterations[0].ratio,
              // "test_458_sjeng_.base.iterations0.ratio":
              //   payload.SPECrate2006_int.results.test_458_sjeng_.base
              //     .iterations[0].ratio,
              // "test_462_libquantum_.base.iterations0.ratio":
              //   payload.SPECrate2006_int.results.test_462_libquantum_.base
              //     .iterations[0].ratio,
              // "test_464_h264ref_.base.iterations0.ratio":
              //   payload.SPECrate2006_int.results.test_464_h264ref_.base
              //     .iterations[0].ratio,
              // "test_471_omnetpp_.base.iterations0.ratio":
              //   payload.SPECrate2006_int.results.test_471_omnetpp_.base
              //     .iterations[0].ratio,
              // "test_473_astar_.base.iterations0.ratio":
              //   payload.SPECrate2006_int.results.test_473_astar_.base
              //     .iterations[0].ratio,
              // "test_483_xalancbmk_.base.iterations0.ratio":
              //   payload.SPECrate2006_int.results.test_483_xalancbmk_.base
              //     .iterations[0].ratio,
            };

            sync(
              payload.test_dimensions.iteration_guid,
              incomingPayload,
              tpic,
              "SPECrate2006_int"
            );
          } else if (Object.keys(payloadRaw).includes("SPECrate2017_fp")) {
            // log("specrate2017fp");
            incomingPayload = {
              msg_ts: kafkaMsgtime,

              iteration_guid: payload.test_dimensions.iteration_guid,
              iteration_name: payload.test_dimensions.iteration_name,
              test_name: payload.test_dimensions.test_name,
              bios_name: payload.system_configuration.bios.bios_name,
              s0_serial_number:
                payload.sut_dimensions.socket[0].iod.serial_number,
              s1_serial_number:
                payload.sut_dimensions.socket[1].iod.serial_number,
              // mean: payload.SPECrate2017_fp.base.mean,
              // "test_503_bwaves_r_.base.iterations0.ratio":
              //   payload.SPECrate2017_fp.results.test_503_bwaves_r_.base
              //     .iterations[0].ratio,
              // "test_507_cactuBSSN_r_.base.iterations0.ratio":
              //   payload.SPECrate2017_fp.results.test_507_cactuBSSN_r_.base
              //     .iterations[0].ratio,
              // "test_508_namd_r_.base.iterations0.ratio":
              //   payload.SPECrate2017_fp.results.test_508_namd_r_.base
              //     .iterations[0].ratio,
              // "test_510_parest_r_.base.iterations0.ratio":
              //   payload.SPECrate2017_fp.results.test_510_parest_r_.base
              //     .iterations[0].ratio,
              // "test_511_povray_r_.base.iterations0.ratio":
              //   payload.SPECrate2017_fp.results.test_511_povray_r_.base
              //     .iterations[0].ratio,
              // "test_519_lbm_r_.base.iterations0.ratio":
              //   payload.SPECrate2017_fp.results.test_519_lbm_r_.base
              //     .iterations[0].ratio,
              // "test_521_wrf_r_.base.iterations0.ratio":
              //   payload.SPECrate2017_fp.results.test_521_wrf_r_.base
              //     .iterations[0].ratio,
              // "test_526_blender_r_.base.iterations0.ratio":
              //   payload.SPECrate2017_fp.results.test_526_blender_r_.base
              //     .iterations[0].ratio,
              // "test_527_cam4_r_.base.iterations0.ratio":
              //   payload.SPECrate2017_fp.results.test_527_cam4_r_.base
              //     .iterations[0].ratio,
              // "test_538_imagick_r_.base.iterations0.ratio":
              //   payload.SPECrate2017_fp.results.test_538_imagick_r_.base
              //     .iterations[0].ratio,
              // "test_544_nab_r_.base.iterations0.ratio":
              //   payload.SPECrate2017_fp.results.test_544_nab_r_.base
              //     .iterations[0].ratio,
              // "test_549_fotonik3d_r_.base.iterations0.ratio":
              //   payload.SPECrate2017_fp.results.test_549_fotonik3d_r_.base
              //     .iterations[0].ratio,
              // "test_554_roms_r_.base.iterations0.ratio":
              //   payload.SPECrate2017_fp.results.test_554_roms_r_.base
              //     .iterations[0].ratio,
            };

            sync(
              payload.test_dimensions.iteration_guid,
              incomingPayload,
              tpic,
              "SPECrate2017_fp"
            );
          } else if (Object.keys(payloadRaw).includes("SPECrate2017_int")) {
            // log("specrate2017int");

            incomingPayload = {
              msg_ts: kafkaMsgtime,

              iteration_guid: payload.test_dimensions.iteration_guid,
              iteration_name: payload.test_dimensions.iteration_name,
              test_name: payload.test_dimensions.test_name,
              bios_name: payload.system_configuration.bios.bios_name,
              s0_serial_number:
                payload.sut_dimensions.socket[0].iod.serial_number,
              s1_serial_number:
                payload.sut_dimensions.socket[1].iod.serial_number,
              // mean: payload.SPECrate2017_int.base.mean,
              // "test_500_perlbench_r_.base.iterations0.ratio":
              //   payload.SPECrate2017_int.results.test_500_perlbench_r_.base
              //     .iterations[0].ratio,
              // "test_502_gcc_r_.base.iterations0.ratio":
              //   payload.SPECrate2017_int.results.test_502_gcc_r_.base
              //     .iterations[0].ratio,
              // "test_505_mcf_r_.base.iterations0.ratio":
              //   payload.SPECrate2017_int.results.test_505_mcf_r_.base
              //     .iterations[0].ratio,
              // "test_520_omnetpp_r_.base.iterations0.ratio":
              //   payload.SPECrate2017_int.results.test_520_omnetpp_r_.base
              //     .iterations[0].ratio,
              // "test_523_xalancbmk_r_.base.iterations0.ratio":
              //   payload.SPECrate2017_int.results.test_523_xalancbmk_r_.base
              //     .iterations[0].ratio,
              // "test_525_x264_r_.base.iterations0.ratio":
              //   payload.SPECrate2017_int.results.test_525_x264_r_.base
              //     .iterations[0].ratio,
              // "test_531_deepsjeng_r_.base.iterations0.ratio":
              //   payload.SPECrate2017_int.results.test_531_deepsjeng_r_.base
              //     .iterations[0].ratio,
              // "test_541_leela_r_.base.iterations0.ratio":
              //   payload.SPECrate2017_int.results.test_541_leela_r_.base
              //     .iterations[0].ratio,
              // "test_548_exchange2_r_.base.iterations0.ratio":
              //   payload.SPECrate2017_int.results.test_548_exchange2_r_.base
              //     .iterations[0].ratio,
              // "test_557_xz_r_.base.iterations0.ratio":
              //   payload.SPECrate2017_int.results.test_557_xz_r_.base
              //     .iterations[0].ratio,
            };

            sync(
              payload.test_dimensions.iteration_guid,
              incomingPayload,
              tpic,
              "SPECrate2017_int"
            );
          } else if (Object.keys(payloadRaw).includes("SPECspeed2006_fp")) {
            // log("specspeed2006fp");
            incomingPayload = {
              msg_ts: kafkaMsgtime,

              iteration_guid: payload.test_dimensions.iteration_guid,
              iteration_name: payload.test_dimensions.iteration_name,
              test_name: payload.test_dimensions.test_name,
              bios_name: payload.system_configuration.bios.bios_name,
              s0_erial_number:
                payload.sut_dimensions.socket[0].iod.serial_number,
              s1_serial_number:
                payload.sut_dimensions.socket[1].iod.serial_number,
              // mean: payload.SPECspeed2006_fp.base.mean,
              // "_410_bwaves_.base.iterations0.ratio":
              //   payload.SPECspeed2006_fp.results._410_bwaves_.base.iterations[0]
              //     .ratio,
              // "_416_gamess_.base.iterations0.ratio":
              //   payload.SPECspeed2006_fp.results._416_gamess_.base.iterations[0]
              //     .ratio,
              // "_433_milc_.base.iterations0.ratio":
              //   payload.SPECspeed2006_fp.results._433_milc_.base.iterations[0]
              //     .ratio,
              // "_434_zeusmp_.base.iterations0.ratio":
              //   payload.SPECspeed2006_fp.results._434_zeusmp_.base.iterations[0]
              //     .ratio,
              // "_435_gromacs_.base.iterations0.ratio":
              //   payload.SPECspeed2006_fp.results._435_gromacs_.base
              //     .iterations[0].ratio,
              // "_436_cactusADM_.base.iterations0.ratio":
              //   payload.SPECspeed2006_fp.results._436_cactusADM_.base
              //     .iterations[0].ratio,
              // "_437_leslie3d_.base.iterations0.ratio":
              //   payload.SPECspeed2006_fp.results._437_leslie3d_.base
              //     .iterations[0].ratio,
              // "_444_namd_.base.iterations0.ratio":
              //   payload.SPECspeed2006_fp.results._444_namd_.base.iterations[0]
              //     .ratio,
              // "_447_dealII_.base.iterations0.ratio":
              //   payload.SPECspeed2006_fp.results._447_dealII_.base.iterations[0]
              //     .ratio,
              // "_450_soplex_.base.iterations0.ratio":
              //   payload.SPECspeed2006_fp.results._450_soplex_.base.iterations[0]
              //     .ratio,
              // "_453_povray_.base.iterations0.ratio":
              //   payload.SPECspeed2006_fp.results._453_povray_.base.iterations[0]
              //     .ratio,
              // "_454_calculix_.base.iterations0.ratio":
              //   payload.SPECspeed2006_fp.results._454_calculix_.base
              //     .iterations[0].ratio,
              // "_459_GemsFDTD_.base.iterations0.ratio":
              //   payload.SPECspeed2006_fp.results._459_GemsFDTD_.base
              //     .iterations[0].ratio,
              // "_465_tonto_.base.iterations0.ratio":
              //   payload.SPECspeed2006_fp.results._465_tonto_.base.iterations[0]
              //     .ratio,
              // "_470_lbm_.base.iterations0.ratio":
              //   payload.SPECspeed2006_fp.results._470_lbm_.base.iterations[0]
              //     .ratio,
              // "_481_wrf_.base.iterations0.ratio":
              //   payload.SPECspeed2006_fp.results._481_wrf_.base.iterations[0]
              //     .ratio,
              // "_482_sphinx3_.base.iterations0.ratio":
              //   payload.SPECspeed2006_fp.results._482_sphinx3_.base
              //     .iterations[0].ratio,
            };
            sync(
              payload.test_dimensions.iteration_guid,
              incomingPayload,
              tpic,
              "SPECspeed2006_fp"
            );
          } else if (Object.keys(payloadRaw).includes("SPECspeed2006_int")) {
            // log("specspeed2006int");
            incomingPayload = {
              msg_ts: kafkaMsgtime,

              iteration_guid: payload.test_dimensions.iteration_guid,
              iteration_name: payload.test_dimensions.iteration_name,
              test_name: payload.test_dimensions.test_name,
              bios_name: payload.system_configuration.bios.bios_name,
              s0_serial_number:
                payload.sut_dimensions.socket[0].iod.serial_number,
              s1_serial_number:
                payload.sut_dimensions.socket[1].iod.serial_number,
              // mean: payload.SPECspeed2006_int.base.mean,
              // "test_400_perlbench_.base.iterations0.ratio":
              //   payload.SPECspeed2006_int.results.test_400_perlbench_.base
              //     .iterations[0].ratio,
              // "test_401_bzip2_.base.iterations0.ratio":
              //   payload.SPECspeed2006_int.results.test_401_bzip2_.base
              //     .iterations[0].ratio,
              // "test_403_gcc_.base.iterations0.ratio":
              //   payload.SPECspeed2006_int.results.test_403_gcc_.base
              //     .iterations[0].ratio,
              // "test_429_mcf_.base.iterations0.ratio":
              //   payload.SPECspeed2006_int.results.test_429_mcf_.base
              //     .iterations[0].ratio,
              // "test_445_gobmk_.base.iterations0.ratio":
              //   payload.SPECspeed2006_int.results.test_445_gobmk_.base
              //     .iterations[0].ratio,
              // "test_456_hmmer_.base.iterations0.ratio":
              //   payload.SPECspeed2006_int.results.test_456_hmmer_.base
              //     .iterations[0].ratio,
              // "test_458_sjeng_.base.iterations0.ratio":
              //   payload.SPECspeed2006_int.results.test_458_sjeng_.base
              //     .iterations[0].ratio,
              // "test_462_libquantum_.base.iterations0.ratio":
              //   payload.SPECspeed2006_int.results.test_462_libquantum_.base
              //     .iterations[0].ratio,
              // "test_464_h264ref_.base.iterations0.ratio":
              //   payload.SPECspeed2006_int.results.test_464_h264ref_.base
              //     .iterations[0].ratio,
              // "test_471_omnetpp_.base.iterations0.ratio":
              //   payload.SPECspeed2006_int.results.test_471_omnetpp_.base
              //     .iterations[0].ratio,
              // "test_473_astar_.base.iterations0.ratio":
              //   payload.SPECspeed2006_int.results.test_473_astar_.base
              //     .iterations[0].ratio,
              // "test_483_xalancbmk_.base.iterations0.ratio":
              //   payload.SPECspeed2006_int.results.test_483_xalancbmk_.base
              //     .iterations[0].ratio,
            };
            sync(
              payload.test_dimensions.iteration_guid,
              incomingPayload,
              tpic,
              "SPECspeed2006_int"
            );
          } else if (Object.keys(payloadRaw).includes("SPECspeed2017_fp")) {
            // log("specspeed2017fp");
            incomingPayload = {
              msg_ts: kafkaMsgtime,

              iteration_guid: payload.test_dimensions.iteration_guid,
              iteration_name: payload.test_dimensions.iteration_name,
              test_name: payload.test_dimensions.test_name,
              bios_name: payload.system_configuration.bios.bios_name,
              s0_serial_number:
                payload.sut_dimensions.socket[0].iod.serial_number,
              s1_serial_number:
                payload.sut_dimensions.socket[1].iod.serial_number,
              // mean: payload.SPECspeed2017_fp.base.mean,
              // "test_603_bwaves_s_.base.iterations0.ratio":
              //   payload.SPECspeed2017_fp.results.test_603_bwaves_s_.base
              //     .iterations[0].ratio,
              // "test_607_cactuBSSN_s_.base.iterations0.ratio":
              //   payload.SPECspeed2017_fp.results.test_607_cactuBSSN_s_.base
              //     .iterations[0].ratio,
              // "test_619_lbm_s_.base.iterations0.ratio":
              //   payload.SPECspeed2017_fp.results.test_619_lbm_s_.base
              //     .iterations[0].ratio,
              // "test_621_wrf_s_.base.iterations0.ratio":
              //   payload.SPECspeed2017_fp.results.test_621_wrf_s_.base
              //     .iterations[0].ratio,
              // "test_627_cam4_s_.base.iterations0.ratio":
              //   payload.SPECspeed2017_fp.results.test_627_cam4_s_.base
              //     .iterations[0].ratio,
              // "test_628_pop2_s_.base.iterations0.ratio":
              //   payload.SPECspeed2017_fp.results.test_628_pop2_s_.base
              //     .iterations[0].ratio,
              // "test_638_imagick_s_.base.iterations0.ratio":
              //   payload.SPECspeed2017_fp.results.test_638_imagick_s_.base
              //     .iterations[0].ratio,
              // "test_644_nab_s_.base.iterations0.ratio":
              //   payload.SPECspeed2017_fp.results.test_644_nab_s_.base
              //     .iterations[0].ratio,
              // "test_649_fotonik3d_s_.base.iterations0.ratio":
              //   payload.SPECspeed2017_fp.results.test_649_fotonik3d_s_.base
              //     .iterations[0].ratio,
              // "test_654_roms_s_.base.iterations0.ratio":
              //   payload.SPECspeed2017_fp.results.test_654_roms_s_.base
              //     .iterations[0].ratio,
            };
            sync(
              payload.test_dimensions.iteration_guid,
              incomingPayload,
              tpic,
              "SPECspeed2017_fp"
            );
          } else if (Object.keys(payloadRaw).includes("SPECspeed2017_int")) {
            // log("specspeed2017int");
            incomingPayload = {
              msg_ts: kafkaMsgtime,

              iteration_guid: payload.test_dimensions.iteration_guid,
              iteration_name: payload.test_dimensions.iteration_name,
              test_name: payload.test_dimensions.test_name,
              bios_name: payload.system_configuration.bios.bios_name,
              s0_serial_number:
                payload.sut_dimensions.socket[0].iod.serial_number,
              s1_serial_number:
                payload.sut_dimensions.socket[1].iod.serial_number,
              // mean: payload.SPECspeed2017_int.base.mean,
              // "test_600_perlbench_s_.base.iterations0.ratio":
              //   payload.SPECspeed2017_int.results.test_600_perlbench_s_.base
              //     .iterations[0].ratio,
              // "test_602_gcc_s_.base.iterations0.ratio":
              //   payload.SPECspeed2017_int.results.test_602_gcc_s_.base
              //     .iterations[0].ratio,
              // "test_605_mcf_s_.base.iterations0.ratio":
              //   payload.SPECspeed2017_int.results.test_605_mcf_s_.base
              //     .iterations[0].ratio,
              // "test_620_omnetpp_s_.base.iterations0.ratio":
              //   payload.SPECspeed2017_int.results.test_620_omnetpp_s_.base
              //     .iterations[0].ratio,
              // "test_623_xalancbmk_s_.base.iterations0.ratio":
              //   payload.SPECspeed2017_int.results.test_623_xalancbmk_s_.base
              //     .iterations[0].ratio,
              // "test_625_x264_s_.base.iterations0.ratio":
              //   payload.SPECspeed2017_int.results.test_625_x264_s_.base
              //     .iterations[0].ratio,
              // "test_631_deepsjeng_s_.base.iterations0.ratio":
              //   payload.SPECspeed2017_int.results.test_631_deepsjeng_s_.base
              //     .iterations[0].ratio,
              // "test_641_leela_s_.base.iterations0.ratio":
              //   payload.SPECspeed2017_int.results.test_641_leela_s_.base
              //     .iterations[0].ratio,
              // "test_648_exchange2_s_.base.iterations0.ratio":
              //   payload.SPECspeed2017_int.results.test_648_exchange2_s_.base
              //     .iterations[0].ratio,
              // "test_657_xz_s_.base.iterations0.ratio":
              //   payload.SPECspeed2017_int.results.test_657_xz_s_.base
              //     .iterations[0].ratio,
            };
            sync(
              payload.test_dimensions.iteration_guid,
              incomingPayload,
              tpic,
              "SPECspeed2017_int"
            );
          }
        },
      });
    })
    .catch((e) => log(`Error: ${e} - ${racedayTopic}`));
});
