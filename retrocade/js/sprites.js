// Small indexed-color sprites stay sharp at cabinet and phone sizes.
const ArcadeSprites = (() => {
  const patterns = {
    car: ['..111111..','.12222221.','1123223211','4122222214','4123333214','.12355321.','.12355321.','.12222221.','4122332214','4122332214','.12622621.','..111111..'],
    bear: ['.111..111.','1222112221','.12222221.','1222222221','1234224321','1222552221','.12244221.','..122221..','.12255221.','1222552221','.111..111.'],
    alien: ['..1.....1..','...1...1...','..1222221..','.122322321.','12224222421','12222222221','1.1222221.1','1.1.....1.1','...11.11...'],
    ship: ['.....3.....','....323....','....252....','...12521...','..1125211..','.121252121.','12222522221','12321112321','11.16.61.11','....6.6....'],
    apple: ['....14..22','....14222.','..666166..','.63366666.','6336666666','6366666666','6666666666','.66666666.','..661166..'],
    block: ['11111111','13333321','13222241','13222241','13222241','13222241','12444441','11111111']
  };
  const cache = new Map();
  function draw(ctx, name, x, y, width, height, accent) {
    const key = name + accent;
    if (!cache.has(key)) {
      const rows = patterns[name];
      const image = document.createElement('canvas');
      image.width = rows[0].length;
      image.height = rows.length;
      const pen = image.getContext('2d');
      const colors = ['', '#21203b', accent, '#fff6cf', '#413557', '#76eaff', '#ff685a'];
      rows.forEach((row, j) => [...row].forEach((pixel, i) => {
        if (pixel === '.') return;
        pen.fillStyle = colors[Number(pixel)];
        pen.fillRect(i, j, 1, 1);
      }));
      cache.set(key, image);
    }
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(cache.get(key), x, y, width, height);
    ctx.restore();
  }
  return { draw };
})();
