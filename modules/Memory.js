import { addr2hex, num2hex, message, stripText } from './utils';

function Memory() {
  var memArray = new Array(0x600);

  function set(addr, val) {
    return memArray[addr] = val;
  }

  function get(addr) {
    return memArray[addr];
  }

  function getWord(addr) {
    return get(addr) + (get(addr + 1) << 8);
  }

  // storeByte() - Poke a byte, don't touch any registers

  function storeByte(addr, value) {
    set(addr, value & 0xff);
    if ((addr >= 0x200) && (addr <= 0x5ff)) {
      display.updatePixel(addr);
    }
  }

  // storeKeypress() - Store keycode in ZP $ff
  function storeKeypress(e) {
    value = e.which;
    memory.storeByte(0xff, value);
  }

  function format(start, length) {
    var html = '';
    var n;

    for (var x = 0; x < length; x++) {
      if ((x & 15) === 0) {
        if (x > 0) { html += "\n"; }
        n = (start + x);
        html += num2hex(((n >> 8) & 0xff));
        html += num2hex((n & 0xff));
        html += ": ";
      }
      html += num2hex(memory.get(start + x));
      html += " ";
    }
    return html;
  }

  return {
    set,
    get,
    getWord,
    storeByte,
    storeKeypress,
    format,
  };
}

export default Memory;
