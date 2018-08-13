const config = require("./config");
const r = require("rethinkdbdash")({db: config.db});
const uuid = require("uuid/v1");


async function run(id) {
  let counter = 0;
  setInterval(() => {
    console.log(`id: ${id} inserted ${counter}`);
    counter = 0;
  }, 1000);

  while(true) {
    let tasks = new Array(10).fill(0).map(task => makeTask());
    await r.table(config.table).insert(tasks).run().then(() => counter = counter + 1).catch(console.error);
  }
}

function makeTask() {
  return {
    id: uuid(),
    numerator: Math.random() * 30,
    denominator: Math.random() * 30,
    state: "waiting",
    waitingSince: r.now()
  }
}

function wait(delay) {
  return new Promise(resolve => setTimeout(resolve, delay))
}

async function runRun() {
  for (let i in new Array(20).fill(0)) {
    console.log("Starting " + i);
    run(i).catch(console.error);
    await wait(1000);
  }
}

runRun().catch(console.log);