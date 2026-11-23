const CabinetItems = (() => {
  const image = new Image();
  image.src = new URL('../art/items.webp', document.currentScript.src);
  return (ctx, index, x, y, w, h) => {
    if (!image.complete || !image.naturalWidth) return false;
    ctx.drawImage(image, (index % 4) * 128, Math.floor(index / 4) * 128, 128, 128, x, y, w, h);
    return true;
  };
})();
