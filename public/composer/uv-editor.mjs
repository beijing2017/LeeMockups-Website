const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function visitUvTriangles(mesh, visit) {
  let count = 0;
  const emit = (a, b, c, d, e, f) => {
    if ([a, b, c, d, e, f].every(Number.isFinite)) {
      visit(a, b, c, d, e, f);
      count += 1;
    }
  };
  if (mesh instanceof Float32Array) {
    for (let offset = 0; offset + 14 < mesh.length; offset += 15) {
      emit(mesh[offset + 3], mesh[offset + 4], mesh[offset + 8], mesh[offset + 9], mesh[offset + 13], mesh[offset + 14]);
    }
  } else if (mesh?.vertices instanceof Float32Array && mesh.indices) {
    const data = mesh.vertices;
    const indices = mesh.indices;
    for (let offset = 0; offset + 2 < indices.length; offset += 3) {
      const a = indices[offset] * 5 + 3;
      const b = indices[offset + 1] * 5 + 3;
      const c = indices[offset + 2] * 5 + 3;
      emit(data[a], data[a + 1], data[b], data[b + 1], data[c], data[c + 1]);
    }
  } else if (Array.isArray(mesh)) {
    for (const triangle of mesh) {
      const vertices = triangle?.vertices || triangle;
      if (vertices?.length === 3) emit(vertices[0].u, vertices[0].v, vertices[1].u, vertices[1].v, vertices[2].u, vertices[2].v);
    }
  }
  return count;
}

export function artworkRect(imageWidth, imageHeight, stageWidth, stageHeight, scale, centerU, centerV) {
  if (!(imageWidth > 0 && imageHeight > 0 && stageWidth > 0 && stageHeight > 0 && scale > 0)) return null;
  const fit = Math.min(stageWidth / imageWidth, stageHeight / imageHeight);
  const width = imageWidth * fit * scale;
  const height = imageHeight * fit * scale;
  return { x: centerU * stageWidth - width / 2, y: centerV * stageHeight - height / 2, width, height };
}

export function artworkUv(u, v, scale, centerU, centerV) {
  return { u: (u - centerU) / scale + .5, v: (v - centerV) / scale + .5 };
}

function maskOverlays(canvas, mesh) {
  const width = canvas.width;
  const height = canvas.height;
  const mask = document.createElement('canvas');
  mask.width = width;
  mask.height = height;
  const context = mask.getContext('2d', { willReadFrequently: true });
  context.fillStyle = '#000';
  const triangles = visitUvTriangles(mesh, (a, b, c, d, e, f) => {
    context.beginPath();
    context.moveTo(a * width, b * height);
    context.lineTo(c * width, d * height);
    context.lineTo(e * width, f * height);
    context.closePath();
    context.fill();
  });
  if (!triangles) return null;
  const alpha = context.getImageData(0, 0, width, height).data;
  const used = new Uint8Array(width * height);
  let covered = 0;
  for (let position = 0; position < used.length; position++) {
    used[position] = alpha[position * 4 + 3] > 0 ? 1 : 0;
    covered += used[position];
  }
  if (!covered) return null;
  const createOverlay = withArtwork => {
    const output = document.createElement('canvas');
    output.width = width;
    output.height = height;
    const outputContext = output.getContext('2d');
    const pixels = outputContext.createImageData(width, height);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const position = y * width + x;
      const target = position * 4;
      if (used[position]) {
        const edge = x === 0 || y === 0 || x === width - 1 || y === height - 1 ||
          !used[position - 1] || !used[position + 1] || !used[position - width] || !used[position + width];
        pixels.data[target] = 116;
        pixels.data[target + 1] = 72;
        pixels.data[target + 2] = 239;
        pixels.data[target + 3] = edge ? 220 : withArtwork ? 0 : 32;
      } else if (withArtwork) {
        pixels.data[target] = 249;
        pixels.data[target + 1] = 247;
        pixels.data[target + 2] = 250;
        pixels.data[target + 3] = 170;
      }
    }
    outputContext.putImageData(pixels, 0, 0);
    return output;
  };
  return { empty: createOverlay(false), placed: createOverlay(true) };
}

export function createUvEditor({ canvas, scaleInput, scaleValue, resetButton, hint, onChange }) {
  const context = canvas.getContext('2d');
  let artwork = null;
  let overlays = null;
  let scale = 1;
  let centerU = .5;
  let centerV = .5;
  let locked = false;
  let drag = null;
  const transform = () => ({ centerU, centerV, scale });
  const draw = () => {
    const width = canvas.width;
    const height = canvas.height;
    context.fillStyle = '#f9f7fa';
    context.fillRect(0, 0, width, height);
    context.strokeStyle = '#dfd7e7';
    context.lineWidth = 1;
    for (let step = 1; step < 4; step++) {
      const fraction = step / 4;
      context.beginPath();
      context.moveTo(width * fraction, 0);
      context.lineTo(width * fraction, height);
      context.moveTo(0, height * fraction);
      context.lineTo(width, height * fraction);
      context.stroke();
    }
    let rect;
    if (artwork) {
      rect = artworkRect(artwork.width, artwork.height, width, height, scale, centerU, centerV);
      context.drawImage(artwork, rect.x, rect.y, rect.width, rect.height);
    }
    if (overlays) context.drawImage(artwork ? overlays.placed : overlays.empty, 0, 0);
    if (rect) {
      context.save();
      context.strokeStyle = '#7448ef';
      context.lineWidth = 2;
      context.setLineDash([8, 6]);
      context.strokeRect(rect.x, rect.y, rect.width, rect.height);
      context.restore();
    }
    context.strokeStyle = '#bca8d3';
    context.lineWidth = 2;
    context.strokeRect(1, 1, width - 2, height - 2);
  };
  const update = () => {
    scaleValue.textContent = Math.round(scale * 100) + '%';
    draw();
    onChange(transform());
  };
  const setLocked = value => {
    locked = !!value;
    scaleInput.disabled = locked || !artwork;
    resetButton.disabled = locked || !artwork;
    canvas.style.cursor = artwork && !locked ? 'grab' : 'default';
  };
  scaleInput.addEventListener('input', () => {
    if (locked || !artwork) return;
    scale = Number(scaleInput.value) / 100;
    update();
  });
  resetButton.addEventListener('click', () => {
    if (locked || !artwork) return;
    centerU = centerV = .5;
    scale = 1;
    scaleInput.value = '100';
    update();
  });
  const point = event => {
    const bounds = canvas.getBoundingClientRect();
    return { u: (event.clientX - bounds.left) / bounds.width, v: (event.clientY - bounds.top) / bounds.height };
  };
  canvas.addEventListener('pointerdown', event => {
    if (locked || !artwork) return;
    event.preventDefault();
    const start = point(event);
    drag = { id: event.pointerId, u: start.u, v: start.v, centerU, centerV };
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const current = point(event);
    centerU = clamp(drag.centerU + current.u - drag.u, -.75, 1.75);
    centerV = clamp(drag.centerV + current.v - drag.v, -.75, 1.75);
    update();
  });
  const stopDrag = event => {
    if (!drag || event.pointerId !== drag.id) return;
    drag = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    canvas.style.cursor = locked ? 'default' : 'grab';
  };
  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointercancel', stopDrag);
  canvas.addEventListener('keydown', event => {
    if (locked || !artwork || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const amount = event.shiftKey ? .05 : .01;
    if (event.key === 'ArrowLeft') centerU -= amount;
    if (event.key === 'ArrowRight') centerU += amount;
    if (event.key === 'ArrowUp') centerV -= amount;
    if (event.key === 'ArrowDown') centerV += amount;
    centerU = clamp(centerU, -.75, 1.75);
    centerV = clamp(centerV, -.75, 1.75);
    update();
  });
  draw();
  return {
    setSlot(width, height) {
      const maxDimension = 600;
      const ratio = width / height;
      canvas.width = Math.round(maxDimension * Math.min(1, ratio));
      canvas.height = Math.round(maxDimension * Math.min(1, 1 / ratio));
      overlays = null;
      draw();
    },
    setMesh(mesh) {
      overlays = maskOverlays(canvas, mesh);
      hint.textContent = overlays ? 'The outlined shape is the usable UV area.' : 'UV outline is unavailable for this mockup.';
      draw();
    },
    setArtwork(bitmap) {
      artwork?.close();
      artwork = bitmap;
      centerU = centerV = .5;
      scale = 1;
      scaleInput.value = '100';
      setLocked(false);
      update();
    },
    setLocked,
    getTransform: transform,
    dispose() { artwork?.close(); artwork = null; overlays = null; },
  };
}
