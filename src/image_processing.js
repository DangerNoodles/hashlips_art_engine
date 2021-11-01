"use strict";

const path = require("path");
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const fs = require("fs");
const buildDir = path.join(basePath, "/build");

const { createCanvas, loadImage } = require(path.join(
  basePath,
  "/node_modules/canvas"
));

const {
  background,
  layerConfigurations,
  format,
  text,
  debugLogs,
  gif,
} = require(path.join(basePath, "/src/config.js"));

const HashlipsGiffer = require(path.join(
  basePath,
  "/modules/HashlipsGiffer.js"
));

const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");

let hashlipsGiffer = null;

const loadLayerImg = async (_layer) => {
  const image = await loadImage(`${_layer.selectedElement.path}`);

  return {
    layer: _layer,
    loadedImage: image,
  };
};

const addText = (_sig, x, y, size) => {
  ctx.fillStyle = text.color;
  ctx.font = `${text.weight} ${size}pt ${text.family}`;
  ctx.textBaseline = text.baseline;
  ctx.textAlign = text.align;
  ctx.fillText(_sig, x, y);
};

const genColor = () => {
  const hue = Math.floor(Math.random() * 360);
  const pastel = `hsl(${hue}, 100%, ${background.brightness})`;
  return pastel;
};

const drawBackground = () => {
  ctx.fillStyle = background.static ? background.default : genColor();
  ctx.fillRect(0, 0, format.width, format.height);
};

const drawElement = (_renderObject, _index) => {
  ctx.globalAlpha = _renderObject.layer.opacity;
  ctx.globalCompositeOperation = _renderObject.layer.blend;
  text.only
    ? addText(
        `${_renderObject.layer.name}${text.spacer}${_renderObject.layer.selectedElement.name}`,
        text.xGap,
        text.yGap * (_index + 1),
        text.size
      )
    : ctx.drawImage(
        _renderObject.loadedImage,
        0,
        0,
        format.width,
        format.height
      );
};

const saveImage = (_editionCount) => {
  fs.writeFileSync(
    `${buildDir}/images/${_editionCount}.png`,
    canvas.toBuffer("image/png")
  );
};

const processElements = async ({ elements, index, layerConfigIndex }) => {
  // load images
  let renderObjectArray = await Promise.all(
    elements.map((renderObject) => loadLayerImg(renderObject))
  );

  if (debugLogs) console.log("Clearing canvas");
  ctx.clearRect(0, 0, format.width, format.height);

  if (gif.export) {
    hashlipsGiffer = new HashlipsGiffer(
      canvas,
      ctx,
      `${buildDir}/gifs/${index}.gif`,
      gif.repeat,
      gif.quality,
      gif.delay
    );
    hashlipsGiffer.start();
  }

  if (background.generate) {
    drawBackground();
  }

  renderObjectArray.forEach((renderObject, i) => {
    drawElement(
      renderObject,
      i,
      layerConfigurations[layerConfigIndex].layersOrder.length
    );
    if (gif.export) {
      hashlipsGiffer.add();
    }
  });

  if (gif.export) {
    hashlipsGiffer.stop();
  }

  saveImage(index);

  console.log(`Created image for edition: ${index}`);

  // sends message when a child process
  if (process.send) {
    process.send({ layerConfigIndex });
  }
};

process.on("message", processElements);

module.exports = {
  processElements,
};
