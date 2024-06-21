// Controllers
const User = require("./controllers/user");
const Video = require("./controllers/video");

module.exports = (server) => {
  // ------------------------------------------------ //
  // ************ USER ROUTES ************* //
  // ------------------------------------------------ //

  // Log a user in and give them a token
  server.route("post", "/api/login", User.logUserIn);

  // Log a user out
  server.route("delete", "/api/logout", User.logUserOut);

  // Send user info
  server.route("get", "/api/user", User.sendUserInfo);

  // Update a user info
  server.route("put", "/api/user", User.updateUser);

  // ------------------------------------------------ //
  // ************ VIDEO ROUTES ************* //
  // ------------------------------------------------ //

  // Get list of videos of the user
  server.route("get", "/api/videos", Video.getVideos);

  // Upload a video File
  server.route("post", "/api/upload-video", Video.uploadVideo);

  // Extract the audio from the video
  server.route("patch", "/api/video/extract-audio", Video.extractAudio);

  // Resize the video file
  server.route("put", "/api/video/resize", Video.resizeVideo);

  // Get the video assets
  server.route("get", "/get-video-asset", Video.getVideoAssets);
};
