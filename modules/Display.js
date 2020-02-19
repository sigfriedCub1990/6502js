import PALETTE from './constants/colors';

function Display() {
  var displayArray = [];
  var ctx;
  var width;
  var height;
  var pixelSize;
  var numX = 32;
  var numY = 32;

  function initialize() {
    var canvas = $node.find('.screen')[0];
    width = canvas.width;
    height = canvas.height;
    pixelSize = width / numX;
    ctx = canvas.getContext('2d');
    reset();
  }

  function reset() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);
  }

  function updatePixel(addr) {
    ctx.fillStyle = PALETTE[memory.get(addr) & 0x0f];
    var y = Math.floor((addr - 0x200) / 32);
    var x = (addr - 0x200) % 32;
    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
  }

  return {
    initialize: initialize,
    reset: reset,
    updatePixel: updatePixel
  };
}

export default Display;
