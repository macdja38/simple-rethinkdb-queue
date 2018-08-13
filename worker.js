const config = require("./config");
const r = require("rethinkdbdash")({ db: config.db, buffer: 1, max: 2 });
const cluster = require("cluster");

let minDelay = 10;

function wait(delay) {
  return new Promise(resolve => setTimeout(resolve, delay))
}

async function fork() {
  for (let i in new Array(100).fill(0)) {
    cluster.fork();
    await wait(1);
  }
}

if (cluster.isMaster) {
  fork()
} else {
  worker()
}

function doTask(data) {
  let newData = Object.assign({}, data, { state: "completed", result: data.numerator / data.denominator });
  console.log(cluster.worker.id, newData.id);
  return r.table(config.table).get(data.id).update(newData).run()
}

async function worker() {
  while(true) {
    await r.table(config.table)
      .orderBy({ index: "waitingSince" })
      .limit(1)
      .replace(r.branch(r.row("waitingSince").default(false), r.row.merge({ state: "processing" }).without("waitingSince"), r.row), { returnChanges: true })
      .run()
      .then((result) => {
        if (!result.changes) return;
        let { changes: changes } = result;
        if (changes.length > 0) {
          console.log(changes);
        }

        changes.forEach(({new_val: newVal}) => doTask(newVal));
      }).catch(console.error);
  }
}