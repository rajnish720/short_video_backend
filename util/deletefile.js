const fs = require("fs");

exports.deleteFile = (file) => {
  console.log("file in delete function ===========", file);

  if (file && fs.existsSync(file?.path)) {
    fs.unlinkSync(file.path);
  }
};

exports.deleteFiles = (files) => {
  console.log("files in delete function ===========", files);

  if (files?.image) {
    files?.image.forEach((file) => this.deleteFile(file));
  }

  if (files?.svgaImage) {
    files?.svgaImage.forEach((file) => this.deleteFile(file));
  }

  if (files?.postImage) {
    files?.postImage.forEach((file) => this.deleteFile(file));
  }

  if (files?.videoImage) {
    files?.videoImage.forEach((file) => this.deleteFile(file));
  }

  if (files?.videoUrl) {
    files?.videoUrl.forEach((file) => this.deleteFile(file));
  }

  if (files?.songImage) {
    files?.songImage.forEach((file) => this.deleteFile(file));
  }

  if (files?.songLink) {
    files?.songLink.forEach((file) => this.deleteFile(file));
  }

  if (files?.profileSelfie) {
    files?.profileSelfie.forEach((file) => this.deleteFile(file));
  }

  if (files?.document) {
    files?.document.forEach((file) => this.deleteFile(file));
  }

  if (files?.hashTagIcon) {
    files?.hashTagIcon.forEach((file) => this.deleteFile(file));
  }

  if (files?.hashTagBanner) {
    files?.hashTagBanner.forEach((file) => this.deleteFile(file));
  }

  if (files?.audio) {
    files?.audio.forEach((file) => this.deleteFile(file));
  }
};
