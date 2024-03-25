const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const sql = require("./db.js");
const schedule = require("node-schedule");

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Seoul");

//Daily function
const dailyPcIndexList = async () => {
  const now = dayjs();
  const lastDay = now.subtract(1, "DAY");
  const startDay = lastDay.format("YYYY-MM-DD 00:00:00");
  const endDay = now.format("YYYY-MM-DD 00:00:00");

  return new Promise((resolve, reject) => {
    sql.query(
      `SELECT distinct pcIdx FROM cloudpc.tb_cloud_usage_summary where (endConnection < '${now.format(
        "YYYY-MM-DD 00:00:00"
      )}' && endConnection > '${lastDay.format("YYYY-MM-DD 00:00:00")}');`,
      async (err, res) => {
        if (err) {
          console.log(err);
          reject(err);
        }
        const list = res.map((item) => item.pcIdx);
        resolve(list);
      }
    );
  });
};

const dailySummery = async (pcIdx) => {
  const now = dayjs();
  const lastDay = now.subtract(1, "DAY");
  const startDay = lastDay.format("YYYY-MM-DD 00:00:00");
  const endDay = now.format("YYYY-MM-DD 00:00:00");
  return new Promise((resolve, reject) => {
    sql.query(
      `SELECT * FROM cloudpc.tb_cloud_usage_summary where (endConnection < '${now.format(
        "YYYY-MM-DD 00:00:00"
      )}' && endConnection > '${lastDay.format(
        "YYYY-MM-DD 00:00:00"
      )}') && pcIdx=${pcIdx};`,
      async (err, res) => {
        if (err) {
          console.log(err);
          reject(err);
        }
        let summery = 0;
        let Timmer = 0;
        for (let i = 0; i < res.length; i++) {
          summery += res[i].point;
          Timmer += res[i].seconds;
        }
        // const list = res.map((item) => item.pcIdx);
        resolve({
          pcIdx: pcIdx,
          rIdx: res[0].rIdx,
          totalPoint: summery,
          totalSeconds: Timmer,
        });
      }
    );
  });
};

const dailySummeryInsertDB = async (object) => {
  return new Promise((resolve, reject) => {
    sql.query(`Insert Into  tb_cloud_pc_usage set ? `, object, (err, res) => {
      if (err) {
        console.log(err);
        reject(err);
      }
      resolve(res);
    });
  });
};

//montly Function
const montlyPcIdxList = async () => {
  const now = dayjs();
  const lastMonth = now.subtract(1, "M");

  return new Promise((resolve, reject) => {
    sql.query(
      `SELECT distinct pcIdx FROM cloudpc.tb_cloud_pc_usage where (computeDate < '${now.format(
        "YYYY-MM-DD 00:00:00"
      )}' && computeDate > '${lastMonth.format("YYYY-MM-DD 00:00:00")}');`,
      async (err, res) => {
        if (err) {
          console.log(err);
          reject(err);
        }
        console.log("res :>> ", res);
        const list = res.map((item) => item.pcIdx);
        resolve(list);
      }
    );
  });
};

const montlyPcSummeryCacluate = async (pcIdx) => {
  const now = dayjs();
  const lastMonth = now.subtract(1, "M");

  return new Promise((resolve, reject) => {
    sql.query(
      `SELECT * FROM cloudpc.tb_cloud_pc_usage where (computeDate < '${now.format(
        "YYYY-MM-DD 00:00:00"
      )}' && computeDate > '${lastMonth.format(
        "YYYY-MM-DD 00:00:00"
      )}') && pcIdx=${pcIdx};`,
      async (err, res) => {
        if (err) {
          console.log(err);
          reject(err);
        }
        let summery = 0;
        let Timmer = 0;
        for (let i = 0; i < res.length; i++) {
          summery += res[i].totalPoint;
          Timmer += res[i].totalSeconds;
        }
        // const list = res.map((item) => item.pcIdx);
        resolve({
          pcIdx: pcIdx,
          rIdx: res[0].rIdx,
          totalPoint: summery,
          totalSeconds: Timmer,
        });
      }
    );
  });
};

const montlyPcSummeryInsertDB = async (object) => {
  return new Promise((resolve, reject) => {
    sql.query(
      `Insert Into  tb_cloud_pc_usage_montly set ? `,
      object,
      (err, res) => {
        if (err) {
          console.log(err);
          reject(err);
        }
        resolve(res);
      }
    );
  });
};

//메일 0시 10분에 dailyJob  실행
const dailyJob = schedule.scheduleJob("10 0 * * *", async () => {
  //해당 일일 정산할 pc리스트 비동기
  const list = await dailyPcIndexList();
  const pcIdxDocumentList = [];
  try {
    //pc별 시간 포인트 합
    for (let i = 0; i < list.length; i++) {
      const summery = await dailySummery(list[i]);
      pcIdxDocumentList.push(summery);
    }
    //DB에 input
    for (let i = 0; i < pcIdxDocumentList.length; i++) {
      const inputData = await dailySummeryInsertDB(pcIdxDocumentList[i]);
    }
  } catch (err) {
    console.log(err);
  }
  console.log("runDaily :>> ", pcIdxDocumentList);
  return true;
});

//매월 1일 0시 15분에 montlyJob실행
const montlyJob = schedule.scheduleJob("15 0 1 * *", async () => {
  //해당 월정산할 pc리스트 비동기
  const list = await montlyPcIdxList();
  const pcIdxDocumentList = [];
  try {
    //pc별 시간 포인트 합
    for (let i = 0; i < list.length; i++) {
      const summery = await montlyPcSummeryCacluate(list[i]);
      pcIdxDocumentList.push(summery);
    }
    //DB에 input
    for (let i = 0; i < pcIdxDocumentList.length; i++) {
      const inputData = await montlyPcSummeryInsertDB(pcIdxDocumentList[i]);
    }
  } catch (err) {
    console.log(err);
  }
  console.log("runMontly :>> ", runMontly);
  return;
});
