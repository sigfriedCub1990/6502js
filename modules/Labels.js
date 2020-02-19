import { addr2hex, num2hex, message, stripText } from './utils';

function Labels() {
  var labelIndex = [];

  function indexLines(lines) {
    for (var i = 0; i < lines.length; i++) {
      if (!indexLine(lines[i])) {
        message("**Label already defined at line " + (i + 1) + ":** " + lines[i]);
        return false;
      }
    }
    return true;
  }

  // indexLine(line) - extract label if line contains one and calculate position in memory.
  // Return false if label alread exists.
  function indexLine(input) {
    // remove comments
    input = input.replace(/^(.*?);.*/, "$1");

    // trim line
    input = input.replace(/^\s+/, "");
    input = input.replace(/\s+$/, "");

    // Figure out how many bytes this instruction takes
    var currentPC = assembler.getCurrentPC();
    assembler.assembleLine(input); //TODO: find a better way for Labels to have access to assembler

    // Find command or label
    if (input.match(/^\w+:/)) {
      var label = input.replace(/(^\w+):.*$/, "$1");
      return push(label + "|" + currentPC);
    }
    return true;
  }

  // push() - Push label to array. Return false if label already exists.
  function push(name) {
    if (find(name)) {
      return false;
    }
    labelIndex.push(name + "|");
    return true;
  }

  // find() - Returns true if label exists.
  function find(name) {
    var nameAndAddr;
    for (var i = 0; i < labelIndex.length; i++) {
      nameAndAddr = labelIndex[i].split("|");
      if (name === nameAndAddr[0]) {
        return true;
      }
    }
    return false;
  }

  // setPC() - Associates label with address
  function setPC(name, addr) {
    var nameAndAddr;
    for (var i = 0; i < labelIndex.length; i++) {
      nameAndAddr = labelIndex[i].split("|");
      if (name === nameAndAddr[0]) {
        labelIndex[i] = name + "|" + addr;
        return true;
      }
    }
    return false;
  }

  // getPC() - Get address associated with label
  function getPC(name) {
    var nameAndAddr;
    for (var i = 0; i < labelIndex.length; i++) {
      nameAndAddr = labelIndex[i].split("|");
      if (name === nameAndAddr[0]) {
        return (nameAndAddr[1]);
      }
    }
    return -1;
  }

  function displayMessage() {
    var str = "Found " + labelIndex.length + " label";
    if (labelIndex.length !== 1) {
      str += "s";
    }
    message(str + ".");
  }

  function reset() {
    labelIndex = [];
  }

  return {
    indexLines: indexLines,
    find: find,
    getPC: getPC,
    displayMessage: displayMessage,
    reset: reset
  };
}

export default Labels;
