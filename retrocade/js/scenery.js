// Keep backgrounds in the board coordinate system as the cabinet resizes.
const paintScenery = (() => {
  const script = document.currentScript;
  const image = new Image();
  image.src = new URL('../art/' + script.dataset.world + '.webp', script.src);
  return (context, width, height) => {
    if (!image.complete || !image.naturalWidth) return false;
    context.save();
    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0, width, height);
    context.fillStyle = 'rgba(9, 8, 32, .25)';
    context.fillRect(0, 0, width, height);
    context.restore();
    return true;
  };
})();
