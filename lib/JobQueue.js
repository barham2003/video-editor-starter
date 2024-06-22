const DB = require("../src/DB");
const FF = require("./FF");
const util = require("./util");
class JobQueue {
  constructor() {
    this.jobs = [];
    this.currentJob = null;

    DB.update();
    DB.videos.forEach((video) => {
      Object.keys(video.resizes).forEach((key) => {
        if (video.resizes[key].processing) {
          const [width, height] = key.split("x");
          this.enqueue({
            type: "resize",
            videoId: video.videoId,
            width,
            height,
          });
        }
      });
    });
  }

  enqueue(job) {
    this.jobs.push(job);
    this.executeNext();
  }

  dequeue() {
    return this.jobs.shift();
  }
  executeNext() {
    if (this.currentJob) return;
    this.currentJob = this.dequeue();
    if (!this.currentJob) return;
    this.execute(this.currentJob);
  }

  async execute(job) {
    console.log(job);
    if (job.type === "resize") {
      const { width, height, videoId } = job;

      DB.update();
      const video = DB.videos.find((video) => video.videoId === videoId);

      video.resizes[`${width}x${height}`] = { processing: true };
      DB.save();
      const originalVideoPath = `./storage/${video.videoId}/original.${video.extension}`;
      const targetVideoPath = `./storage/${video.videoId}/${width}x${height}.${video.extension}`;
      try {
        await FF.resize(originalVideoPath, targetVideoPath, width, height);

        DB.update();
        const video = DB.videos.find((video) => video.videoId === videoId);
        video.resizes[`${width}x${height}`].processing = false;
        DB.save();

        console.log(
          "Done resizing, Number of jobs remaining: ",
          this.jobs.length
        );
      } catch (e) {
        console.log(e);
        util.deleteFile(targetVideoPath);
      }
    }

    this.currentJob = null;
    this.executeNext();
  }
}

module.exports = JobQueue;
