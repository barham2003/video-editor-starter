const fs = require("node:fs/promises");

const util = {};

// Delete a file if exist, if not the function will not throw an error
util.deleteFile = async (path) => {
  try {
    await fs.unlink(path);
  } catch (e) {
    // Do nothin
  }
};

// Delete a folder if exist, if not the function will not throw an error
util.deleteFolder = async (path) => {
  try {
    await fs.rm(path, { recursive: true });
  } catch (e) {
    // Do nothin
  }
};

module.exports = util;
