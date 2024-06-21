const path = require("path");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const { pipeline } = require("stream/promises");
const util = require("../../lib/util");
const DB = require("../DB");
const FF = require("../../lib/FF");

const getVideos = (req, res, handleError) => {
  DB.update();
  const videos = DB.videos.filter((video) => video.userId === req.userId);
  res.status(200).json(videos);
};

const uploadVideo = async (req, res, handleErr) => {
  const specifiedFileName = req.headers.filename;
  const extension = path.extname(specifiedFileName).substring(1).toLowerCase();
  const fileName = path.parse(specifiedFileName).name;
  const videoId = crypto.randomBytes(4).toString("hex");
  try {
    await fs.mkdir(`./storage/${videoId}`);
    const fullPath = `./storage/${videoId}/original.${extension}`;
    const file = await fs.open(fullPath, "w");
    const fileStream = file.createWriteStream();
    const thumbnailPath = `./storage/${videoId}/thumbnail.jpg`;

    await pipeline(req, fileStream);

    await FF.makeThumbnail(fullPath, thumbnailPath); //* Make thumbnail for the video file

    const dimensions = await FF.getDimensions(fullPath); // * Get dimension

    DB.update();
    DB.videos.unshift({
      id: DB.videos.length,
      videoId,
      name: fileName,
      extension,
      dimensions,
      userId: req.userId,
      extractedAudio: false,
      resizes: {},
    });
    DB.save();

    res.status(201).json({
      status: "success",
      message: "file was uploaded successfully!",
    });
  } catch (e) {
    util.deleteFolder(`./storage/${videoId}`);
    if (e.code !== "ECONNRESET") return handleErr(e);
  }
};

const extractAudio = async (req, res, handleErr) => {
  const videoId = req.params.get("videoId");

  DB.update();
  const video = DB.videos.find((video) => video.videoId === videoId);

  if (video.extractedAudio) {
    return handleErr({
      status: 400,
      message: "The audio has already been extracted for this video.",
    });
  }

  let originalVideoPath = `./storage/${video.videoId}/original.${video.extension}`;
  let targetAudioPath = `./storage/${video.videoId}/audio.aac`;
  try {
    await FF.extractAudio(originalVideoPath, targetAudioPath);
    video.extractedAudio = true;

    DB.save();
    res.status(200).json({
      status: "success",
      message: "The audio was extracted successfully",
    });
  } catch (e) {
    util.deleteFile(targetAudioPath);
    return handleErr(e);
  }
};

const resizeVideo = async (req, res, handleErr) => {
  const videoId = req.body.videoId;
  const width = Number(req.body.width);
  const height = Number(req.body.height);

  DB.update();
  const video = DB.videos.find((video) => video.videoId === videoId);

  video.resizes[`${width}x${height}`] = { processing: true };
  const originalVideoPath = `./storage/${video.videoId}/original.${video.extension}`;
  const targetVideoPath = `./storage/${video.videoId}/${width}x${height}.${video.extension}`;

  try {
    await FF.resize(originalVideoPath, targetVideoPath, width, height);

    video.resizes[`${width}x${height}`].processing = false;
    DB.save();

    res.status(200).json({
      status: "success",
      message: "The video is now being processed!",
    });
  } catch (e) {
    util.deleteFile(targetVideoPath);
    return handleErr(e);
  }
};

const getVideoAssets = async (req, res, handleError) => {
  const videoId = req.params.get("videoId");
  const type = req.params.get("type");
  DB.update();
  const video = DB.videos.find((video) => video.videoId === videoId);

  if (!video)
    return handleError({
      status: 404,
      message: "Video not found",
    });

  let file;
  let mimeType;
  let filename;

  try {
    switch (type) {
      case "thumbnail":
        file = await fs.open(`./storage/${videoId}/thumbnail.jpg`, "r");
        mimeType = "image/jpg";
        break;
      case "audio":
        file = await fs.open(`./storage/${videoId}/audio.aac`, "r");
        mimeType = "audio/aac";
        filename = `${video.name}-audio.aac`;
        break;

      case "resize":
        const dimensions = req.params.get("dimensions");
        file = await fs.open(`./storage/${videoId}/${dimensions}.mp4`, "r");
        mimeType = "video/mp4";
        filename = `${video.name}-${dimensions}.${video.extension}`;
        break;
      case "original":
        file = await fs.open(`./storage/${videoId}/original.mp4`, "r");
        mimeType = "video/mp4";
        console.log(file);
        filename = `${video.name}.${video.extension}`;
        break;
    }

    if (type !== "thumbnail") {
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    }

    // Grab the file size
    const stat = await file.stat();
    const fileStream = file.createReadStream();

    // Set the content type header based on the file type
    res.setHeader("Content-Type", mimeType);

    // Set the content length to the size of the file
    res.setHeader("Content-Length", stat.size);

    res.status(200);
    await pipeline(fileStream, res);

    file.close();
  } catch (e) {
    handleError(e);
  }
};

const controller = {
  getVideos,
  uploadVideo,
  getVideoAssets,
  extractAudio,
  resizeVideo,
};

module.exports = controller;
