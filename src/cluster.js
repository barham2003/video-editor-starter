const cluster = require("cluster");
const JobQueue = require("../lib/JobQueue.js");
const jobs = new JobQueue();
if (cluster.isPrimary) {
  const coreCount = require("node:os").availableParallelism();
  for (let i = 0; i < coreCount; i++) {
    cluster.fork();
  }

  cluster.on("message", (worker, message) => {
    if (message.messageType === "new-resize") {
      const { videoId, height, width } = message.data;
      jobs.enqueue({
        type: "resize",
        width,
        height,
        videoId,
      });
    }
  });

  cluster.on("exit", (worker, code, signal) => {
    console.log(`process ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  require("./index.js");
}
