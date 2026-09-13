export function composeDescription(variable) {
  return `${variable}\n\nWHAT YOU RECEIVE\nA digital LeeMockups template (.mockup). No physical item will be shipped.\n\nHOW TO USE\nOpen the template in the free LeeMockups desktop app, replace the artwork, preview, then export your video and still images.`;
}

export function draftContent(product, observed = {}) {
  const object = observed.object || product.category.toLowerCase();
  const color = observed.color || product.color;
  const motion = observed.motion || product.motion;
  const scene = observed.scene || product.scene;
  const style = observed.style || product.style;
  const lighting = observed.lighting || "";
  const camera = observed.camera || "";
  const words = [motion, color, object].filter(Boolean).map((word) => word.charAt(0).toUpperCase() + word.slice(1));
  const name = `${words.join(" ")} Video Mockup`.replace(/\s+/g, " ").trim();
  const candidates = [
    `${color} ${object} mockup`, `${object} video mockup`, `${motion} ${object}`,
    `animated ${object}`, `3d ${object} mockup`, "video mockup", "digital mockup",
    "product video", "etsy listing video", `${scene} mockup`, `${style} mockup`,
    "custom design mockup", "coffee cup mockup",
  ].map((value) => value.trim().toLowerCase().slice(0, 20));
  const tags = [...new Set(candidates)].slice(0, 13);
  const variable = `Show your artwork on a ${color.toLowerCase()} ${object.toLowerCase()} with ${motion.toLowerCase()} motion in a ${scene.toLowerCase()} setting.`;
  return {
    observations: { object, color, motion, scene, style, lighting, camera },
    productName: name,
    etsyTitle: `${name}, Animated Product Video for Custom Designs`.slice(0, 140),
    variableDescription: variable,
    etsyDescription: composeDescription(variable),
    tags,
    websiteName: name,
    websiteKeywords: tags,
    source: "manual-fallback",
  };
}
