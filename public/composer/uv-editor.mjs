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

export function artworkRect(imageWidth, imageHeight, stageWidth, stageHeight, scaleX, scaleY, centerU, centerV) {
  if (!(imageWidth > 0 && imageHeight > 0 && stageWidth > 0 && stageHeight > 0 && scaleX > 0 && scaleY > 0)) return null;
  const fit = Math.min(stageWidth / imageWidth, stageHeight / imageHeight);
  const width = imageWidth * fit * scaleX;
  const height = imageHeight * fit * scaleY;
  return { x: centerU * stageWidth - width / 2, y: centerV * stageHeight - height / 2, width, height };
}

export function artworkUv(u, v, scaleX, scaleY, centerU, centerV) {
  return { u: (u - centerU) / scaleX + .5, v: (v - centerV) / scaleY + .5 };
}

export function resizeArtworkRect(rect, handle, dx, dy, minWidth, maxWidth, minHeight, maxHeight) {
  const horizontal = handle.includes('w') ? -1 : handle.includes('e') ? 1 : 0;
  const vertical = handle.includes('n') ? -1 : handle.includes('s') ? 1 : 0;
  if (!horizontal && !vertical) return { ...rect };
  let width = rect.width;
  let height = rect.height;
  if (horizontal && vertical) {
    const factor = 1 + (horizontal * width * dx + vertical * height * dy) / (width * width + height * height);
    const limited = clamp(factor, Math.max(minWidth / width, minHeight / height), Math.min(maxWidth / width, maxHeight / height));
    width *= limited;
    height *= limited;
  } else if (horizontal) width = clamp(width + horizontal * dx, minWidth, maxWidth);
  else height = clamp(height + vertical * dy, minHeight, maxHeight);
  const anchorX = horizontal > 0 ? rect.x : rect.x + rect.width;
  const anchorY = vertical > 0 ? rect.y : rect.y + rect.height;
  return {
    x: horizontal ? (horizontal > 0 ? anchorX : anchorX - width) : rect.x,
    y: vertical ? (vertical > 0 ? anchorY : anchorY - height) : rect.y,
    width,
    height,
  };
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

export function createUvEditor({ canvas, resetButton, hint, onChange }) {
  const context = canvas.getContext('2d');
  let artwork = null;
  let overlays = null;
  let scaleX = 1;
  let scaleY = 1;
  let centerU = .5;
  let centerV = .5;
  let locked = false;
  let drag = null;
  const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
  const transform = () => ({ centerU, centerV, scaleX, scaleY });
  const imageRect = () => artwork && artworkRect(
    artwork.width, artwork.height, canvas.width, canvas.height, scaleX, scaleY, centerU, centerV
  );
  const handlePoint = (rect, handle) => ({
    x: rect.x + rect.width * (handle.includes('w') ? 0 : handle.includes('e') ? 1 : .5),
    y: rect.y + rect.height * (handle.includes('n') ? 0 : handle.includes('s') ? 1 : .5),
  });
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
    const rect = imageRect();
    if (rect) context.drawImage(artwork, rect.x, rect.y, rect.width, rect.height);
    if (overlays) context.drawImage(artwork ? overlays.placed : overlays.empty, 0, 0);
    if (rect) {
      context.save();
      context.strokeStyle = '#7448ef';
      context.lineWidth = 2;
      context.strokeRect(rect.x, rect.y, rect.width, rect.height);
      for (const handle of handles) {
        const point = handlePoint(rect, handle);
        if (point.x < 0 || point.x > width || point.y < 0 || point.y > height) continue;
        context.beginPath();
        context.roundRect(point.x - 6, point.y - 6, 12, 12, 3);
        context.fillStyle = '#fff';
        context.fill();
        context.stroke();
      }
      context.restore();
    }
    context.strokeStyle = '#bca8d3';
    context.lineWidth = 2;
    context.strokeRect(1, 1, width - 2, height - 2);
  };
  const update = () => {
    draw();
    onChange(transform());
  };
  const setLocked = value => {
    locked = !!value;
    resetButton.disabled = locked || !artwork;
    canvas.style.cursor = artwork && !locked ? 'grab' : 'default';
  };
  resetButton.addEventListener('click', () => {
    if (locked || !artwork) return;
    centerU = centerV = .5;
    scaleX = scaleY = 1;
    update();
  });
  const point = event => {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * canvas.width / bounds.width,
      y: (event.clientY - bounds.top) * canvas.height / bounds.height,
    };
  };
  const hitHandle = (position, rect) => {
    if (!rect) return null;
    const bounds = canvas.getBoundingClientRect();
    const radiusX = 15 * canvas.width / bounds.width;
    const radiusY = 15 * canvas.height / bounds.height;
    for (const handle of handles) {
      const target = handlePoint(rect, handle);
      if (Math.abs(position.x - target.x) <= radiusX && Math.abs(position.y - target.y) <= radiusY) return handle;
    }
    return null;
  };
  const cursorFor = handle => {
    if (!handle) return 'grab';
    if (handle === 'n' || handle === 's') return 'ns-resize';
    if (handle === 'e' || handle === 'w') return 'ew-resize';
    return handle === 'nw' || handle === 'se' ? 'nwse-resize' : 'nesw-resize';
  };
  canvas.addEventListener('pointerdown', event => {
    if (locked || !artwork) return;
    const position = point(event);
    const rect = imageRect();
    const handle = hitHandle(position, rect);
    if (!handle && (position.x < rect.x || position.x > rect.x + rect.width ||
      position.y < rect.y || position.y > rect.y + rect.height)) return;
    event.preventDefault();
    drag = { id: event.pointerId, start: position, rect, handle, centerU, centerV };
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = handle ? cursorFor(handle) : 'grabbing';
  });
  canvas.addEventListener('pointermove', event => {
    if (locked || !artwork) return;
    const current = point(event);
    if (!drag) {
      canvas.style.cursor = cursorFor(hitHandle(current, imageRect()));
      return;
    }
    if (event.pointerId !== drag.id) return;
    const dx = current.x - drag.start.x;
    const dy = current.y - drag.start.y;
    if (!drag.handle) {
      centerU = clamp(drag.centerU + dx / canvas.width, -2, 3);
      centerV = clamp(drag.centerV + dy / canvas.height, -2, 3);
    } else {
      const base = artworkRect(artwork.width, artwork.height, canvas.width, canvas.height, 1, 1, .5, .5);
      const resized = resizeArtworkRect(drag.rect, drag.handle, dx, dy,
        base.width * .05, base.width * 6, base.height * .05, base.height * 6);
      scaleX = resized.width / base.width;
      scaleY = resized.height / base.height;
      centerU = (resized.x + resized.width / 2) / canvas.width;
      centerV = (resized.y + resized.height / 2) / canvas.height;
    }
    update();
  });
  const stopDrag = event => {
    if (!drag || event.pointerId !== drag.id) return;
    drag = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    canvas.style.cursor = locked ? 'default' : cursorFor(hitHandle(point(event), imageRect()));
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
    centerU = clamp(centerU, -2, 3);
    centerV = clamp(centerV, -2, 3);
    update();
  });
  draw();
  return {
    setSlot(width, height) {
      const maxDimension = 600;
      const ratio = width / height;
      canvas.width = Math.max(1, Math.round(maxDimension * Math.min(1, ratio)));
      canvas.height = Math.max(1, Math.round(maxDimension * Math.min(1, 1 / ratio)));
      overlays = null;
      draw();
    },
    setMesh(mesh) {
      overlays = maskOverlays(canvas, mesh);
      hint.textContent = overlays ? 'Outline shows the usable UV area.' : 'UV outline is unavailable for this mockup.';
      draw();
    },
    setArtwork(bitmap) {
      artwork?.close();
      artwork = bitmap;
      centerU = centerV = .5;
      scaleX = scaleY = 1;
      setLocked(false);
      update();
    },
    setLocked,
    getTransform: transform,
    dispose() { artwork?.close(); artwork = null; overlays = null; },
  };
}
