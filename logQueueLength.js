const config = require("./config");
const r = require("rethinkdbdash")({ db: config.db });

setInterval(() => {
  r
    .do(() =>
      [
        r.table(config.table).getAll("waiting", { index: "state" }).count(),
        r.table(config.table).getAll("processing", { index: "state" }).count(),
        r.table(config.table).getAll("completed", { index: "state" }).count()
      ]
    )
    .run()
    .then(([waiting, processing, done]) => {
      console.log(waiting, processing, done);
    });
}, 500);