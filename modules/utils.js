function addr2hex(addr) {
  return num2hex((addr >> 8) & 0xff) + num2hex(addr & 0xff);
}

function num2hex(nr) {
  var str = "0123456789abcdef";
  var hi = ((nr & 0xf0) >> 4);
  var lo = (nr & 15);
  return str.substring(hi, hi + 1) + str.substring(lo, lo + 1);
}

// message() - Prints text in the message window
function message(text) {
  $node.find('.messages code').append(text + '\n').scrollTop(10000);
}

function stripText($node) {
  console.log($node);
  //Remove leading and trailing space in textarea
  var text = $node.find('.code').val();
  text = text.replace(/^\n+/, '').replace(/\s+$/, '');
  $node.find('.code').val(text);
}

export { addr2hex, num2hex, message, stripText };
