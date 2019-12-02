// @ts-check

import { SIZE, createCanvas } from './layer.js';

const canvasContainer = document.querySelector('.icon__mask');

/**
 * Returns the multiplier to scale the layer by.
 * For example, if padding is 0% then the return value will be 1.
 * @param {import('./layer.js').Layer} layer
 */
const getScale = layer => 1 - layer.padding / 100;

/**
 * Creates a blob URL or data URL for the canvas.
 * @param {HTMLCanvasElement} canvas
 */
export async function toUrl(canvas) {
  if (canvas.toBlob) {
    const blob = await new Promise(resolve =>
      canvas.toBlob(resolve, 'image/png'),
    );
    return URL.createObjectURL(blob);
  } else {
    return canvas.toDataURL('image/png');
  }
}

export class Canvas {
  constructor() {
    /** @type {import('./layer.js').Layer[]} */
    this.layers = [];
  }

  /**
   * Add a layer and display its canvas
   * @param {import('./layer.js').Layer} layer
   */
  add(layer) {
    this.layers.unshift(layer);
    canvasContainer.append(layer.canvas);
    Canvas.draw(layer);
  }

  /**
   * Delete a layer and its corresponding canvas
   * @param {import('./layer.js').Layer} layer
   */
  delete(layer) {
    const index = this.layers.indexOf(layer);
    if (index > -1) {
      this.layers.splice(index, 1);
      canvasContainer.removeChild(layer.canvas);
    }
  }

  export() {
    const sizes = this.layers
      .filter(layer => layer.src)
      .map(layer => {
        const src = /** @type {HTMLImageElement} */ (layer.src);
        return Math.max(src.width, src.height) * getScale(layer);
      });
    const size =
      sizes.length === 0 ? 1024 : sizes.reduce((acc, n) => Math.max(acc, n), 0);

    const mainCanvas = createCanvas(size);
    const ctx = mainCanvas.getContext('2d');

    this.layers
      .slice()
      .reverse()
      .forEach(layer => {
        const canvas = createCanvas(size);
        Canvas._draw(layer, canvas.getContext('2d'), size);
        ctx.drawImage(canvas, 0, 0);
      });

    return mainCanvas;
  }

  /** @param {import('./layer.js').Layer} layer */
  static draw(layer) {
    layer.ctx.clearRect(0, 0, SIZE, SIZE);
    this._draw(layer, layer.ctx, SIZE);
  }

  /**
   * @param {import('./layer.js').Layer} layer
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} size
   */
  static _draw(layer, ctx, size) {
    const scaledSize = getScale(layer) * size;
    const inset = (size - scaledSize) / 2;
    ctx.globalCompositeOperation = 'source-over';
    if (layer.src) {
      ctx.globalAlpha = 1;
      ctx.drawImage(layer.src, inset, inset, scaledSize, scaledSize);
      ctx.globalCompositeOperation = 'source-atop';
    }
    ctx.fillStyle = layer.fill;
    ctx.globalAlpha = layer.alpha / 100;
    ctx.fillRect(inset, inset, scaledSize, scaledSize);
  }
}
