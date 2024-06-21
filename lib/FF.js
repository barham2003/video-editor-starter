const { spawn } = require("node:child_process");

const makeThumbnail = (fullPath, thumbnailPath) => {
  // ffmpeg -i video.mp4 -ss 1 -vframes 1 thumbnail.jpg
  // ffmpeg -i Black.Beauty.2020.1080P.Dsnp.Web-Dl.Atmos.H.264-Evo.mp4 -ss 145 -vframes 1 ./thumbnail.jpg
  // ffmpeg -i original.mp4 -ss 1 -vframes 1 ./thumbnail.jpg
  return new Promise((resolve, reject) => {
    console.log(fullPath, thumbnailPath);
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      fullPath,
      "-ss",
      "5",
      "-vframes",
      "1",
      thumbnailPath,
    ]);

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        console.log("Resolved Thumbail");
        resolve();
      } else {
        reject(`FFmpeg existed with this code: ${code}`);
      }
    });

    ffmpeg.on("message", (message) => {
      console.log(message);
    });

    ffmpeg.on("error", (err) => {
      reject(err);
    });
  });
};

const getDimensions = (fullPath) => {
  // ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 video.mp4
  return new Promise((resolve, reject) => {
    const ffprobe = spawn("ffprobe", [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height",
      "-of",
      "csv=p=0",
      fullPath,
    ]);

    let dimensions = "";
    ffprobe.stdout.on("data", (data) => {
      dimensions += data.toString("utf8");
    });

    ffprobe.on("close", (code) => {
      if (code === 0) {
        dimensions = dimensions.replace(/\s/g, "").split(",");
        resolve({
          width: Number(dimensions[0]),
          height: Number(dimensions[1]),
        });
      } else {
        reject(`FFprobe existed with this code: ${code}`);
      }
    });

    ffprobe.on("error", (err) => {
      reject(err);
    });
  });
};

const extractAudio = (originalVideoPath, targetAudioPath) => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      originalVideoPath,
      "-vn",
      "-c:a",
      "copy",
      targetAudioPath,
    ]);

    ffmpeg.on("error", (err) => {
      reject(err);
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) resolve();
      else reject(`FFmpeg exited with this code: ${code}`);
    });
  });
};

module.exports = { makeThumbnail, getDimensions, extractAudio };
