import { addr2hex, num2hex, message, stripText } from './utils';

import { ADDRESSING_MODES, INSTRUCTION_LENGTH, OP_CODES } from './constants/assembler';

function Assembler() {
  var defaultCodePC;
  var codeLen;
  var codeAssembledOK = false;

  // assembleCode()
  // "assembles" the code into memory
  function assembleCode() {
    simulator.reset();
    labels.reset();
    defaultCodePC = 0x600;
    $node.find('.messages code').empty();

    var code = $node.find('.code').val();
    code += "\n\n";
    var lines = code.split("\n");
    codeAssembledOK = true;

    message("Indexing labels..");

    defaultCodePC = 0x600;

    if (!labels.indexLines(lines)) {
      return false;
    }

    labels.displayMessage();

    defaultCodePC = 0x600;
    message("Assembling code ...");

    codeLen = 0;
    for (var i = 0; i < lines.length; i++) {
      if (!assembleLine(lines[i], i)) {
        codeAssembledOK = false;
        break;
      }
    }

    if (codeLen === 0) {
      codeAssembledOK = false;
      message("No code to run.");
    }

    if (codeAssembledOK) {
      ui.assembleSuccess();
      memory.set(defaultCodePC, 0x00); //set a null byte at the end of the code
    } else {
      var str = lines[i].replace("<", "&lt;").replace(">", "&gt;");
      message("**Syntax error line " + (i + 1) + ": " + str + "**");
      ui.initialize();
      return;
    }

    message("Code assembled successfully, " + codeLen + " bytes.");
  }

  // assembleLine()
  //
  // assembles one line of code.  Returns true if it assembled successfully,
  // false otherwise.
  function assembleLine(input, lineno) {
    var label, command, param, addr;

    // remove comments

    input = input.replace(/^(.*?);.*/, "$1");

    // trim line

    input = input.replace(/^\s+/, "");
    input = input.replace(/\s+$/, "");

    // Find command or label

    if (input.match(/^\w+:/)) {
      label = input.replace(/(^\w+):.*$/, "$1");
      if (input.match(/^\w+:[\s]*\w+.*$/)) {
        input = input.replace(/^\w+:[\s]*(.*)$/, "$1");
        command = input.replace(/^(\w+).*$/, "$1");
      } else {
        command = "";
      }
    } else {
      command = input.replace(/^(\w+).*$/, "$1");
    }

    // Blank line?  Return.

    if (command === "") {
      return true;
    }

    command = command.toUpperCase();

    if (input.match(/^\*\s*=\s*\$?[0-9a-f]*$/)) {
      // equ spotted
      param = input.replace(/^\s*\*\s*=\s*/, "");
      if (param[0] === "$") {
        param = param.replace(/^\$/, "");
        addr = parseInt(param, 16);
      } else {
        addr = parseInt(param, 10);
      }
      if ((addr < 0) || (addr > 0xffff)) {
        message("Unable to relocate code outside 64k memory");
        return false;
      }
      defaultCodePC = addr;
      return true;
    }

    if (input.match(/^\w+\s+.*?$/)) {
      param = input.replace(/^\w+\s+(.*?)/, "$1");
    } else {
      if (input.match(/^\w+$/)) {
        param = "";
      } else {
        return false;
      }
    }

    param = param.replace(/[ ]/g, "");

    if (command === "DCB") {
      return DCB(param);
    }


    for (var o = 0; o < OP_CODES.length; o++) {
      if (OP_CODES[o][0] === command) {
        if (checkSingle(param, OP_CODES[o][11])) { return true; }
        if (checkImmediate(param, OP_CODES[o][1])) { return true; }
        if (checkZeroPage(param, OP_CODES[o][2])) { return true; }
        if (checkZeroPageX(param, OP_CODES[o][3])) { return true; }
        if (checkZeroPageY(param, OP_CODES[o][4])) { return true; }
        if (checkAbsoluteX(param, OP_CODES[o][6])) { return true; }
        if (checkAbsoluteY(param, OP_CODES[o][7])) { return true; }
        if (checkIndirect(param, OP_CODES[o][8])) { return true; }
        if (checkIndirectX(param, OP_CODES[o][9])) { return true; }
        if (checkIndirectY(param, OP_CODES[o][10])) { return true; }
        if (checkAbsolute(param, OP_CODES[o][5])) { return true; }
        if (checkBranch(param, OP_CODES[o][12])) { return true; }
      }
    }
    return false; // Unknown opcode
  }

  function DCB(param) {
    var values, number, str, ch;
    values = param.split(",");
    if (values.length === 0) { return false; }
    for (var v = 0; v < values.length; v++) {
      str = values[v];
      if (str) {
        ch = str.substring(0, 1);
        if (ch === "$") {
          number = parseInt(str.replace(/^\$/, ""), 16);
          pushByte(number);
        } else if (ch >= "0" && ch <= "9") {
          number = parseInt(str, 10);
          pushByte(number);
        } else {
          return false;
        }
      }
    }
    return true;
  }

  // checkBranch() - Commom branch function for all branches (BCC, BCS, BEQ, BNE..)
  function checkBranch(param, opcode) {
    var addr;
    if (opcode === null) { return false; }

    addr = -1;
    if (param.match(/\w+/)) {
      addr = labels.getPC(param);
    }
    if (addr === -1) { pushWord(0x00); return false; }
    pushByte(opcode);
    if (addr < (defaultCodePC - 0x600)) {  // Backwards?
      pushByte((0xff - ((defaultCodePC - 0x600) - addr)) & 0xff);
      return true;
    }
    pushByte((addr - (defaultCodePC - 0x600) - 1) & 0xff);
    return true;
  }

  // checkImmediate() - Check if param is immediate and push value
  function checkImmediate(param, opcode) {
    var value, label, hilo, addr;
    if (opcode === null) { return false; }
    if (param.match(/^#\$[0-9a-f]{1,2}$/i)) {
      pushByte(opcode);
      value = parseInt(param.replace(/^#\$/, ""), 16);
      if (value < 0 || value > 255) { return false; }
      pushByte(value);
      return true;
    }
    if (param.match(/^#[0-9]{1,3}$/i)) {
      pushByte(opcode);
      value = parseInt(param.replace(/^#/, ""), 10);
      if (value < 0 || value > 255) { return false; }
      pushByte(value);
      return true;
    }
    // Label lo/hi
    if (param.match(/^#[<>]\w+$/)) {
      label = param.replace(/^#[<>](\w+)$/, "$1");
      hilo = param.replace(/^#([<>]).*$/, "$1");
      pushByte(opcode);
      if (labels.find(label)) {
        addr = labels.getPC(label);
        switch(hilo) {
        case ">":
          pushByte((addr >> 8) & 0xff);
          return true;
        case "<":
          pushByte(addr & 0xff);
          return true;
        default:
          return false;
        }
      } else {
        pushByte(0x00);
        return true;
      }
    }
    return false;
  }

  // checkIndirect() - Check if param is indirect and push value
  function checkIndirect(param, opcode) {
    var value;
    if (opcode === null) { return false; }
    if (param.match(/^\(\$[0-9a-f]{4}\)$/i)) {
      pushByte(opcode);
      value = param.replace(/^\(\$([0-9a-f]{4}).*$/i, "$1");
      if (value < 0 || value > 0xffff) { return false; }
      pushWord(parseInt(value, 16));
      return true;
    }
    return false;
  }

  // checkIndirectX() - Check if param is indirect X and push value
  function checkIndirectX(param, opcode) {
    var value;
    if (opcode === null) { return false; }
    if (param.match(/^\(\$[0-9a-f]{1,2},X\)$/i)) {
      pushByte(opcode);
      value = param.replace(/^\(\$([0-9a-f]{1,2}).*$/i, "$1");
      if (value < 0 || value > 255) { return false; }
      pushByte(parseInt(value, 16));
      return true;
    }
    return false;
  }

  // checkIndirectY() - Check if param is indirect Y and push value
  function checkIndirectY(param, opcode) {
    var value;
    if (opcode === null) { return false; }
    if (param.match(/^\(\$[0-9a-f]{1,2}\),Y$/i)) {
      pushByte(opcode);
      value = param.replace(/^\([\$]([0-9a-f]{1,2}).*$/i, "$1");
      if (value < 0 || value > 255) { return false; }
      pushByte(parseInt(value, 16));
      return true;
    }
    return false;
  }

  // checkSingle() - Single-byte opcodes
  function checkSingle(param, opcode) {
    if (opcode === null) { return false; }
    // Accumulator instructions are counted as single-byte opcodes
    if (param !== "" && param !== "A") { return false; }
    pushByte(opcode);
    return true;
  }

  // checkZeroPage() - Check if param is ZP and push value
  function checkZeroPage(param, opcode) {
    var value;
    if (opcode === null) { return false; }
    if (param.match(/^\$[0-9a-f]{1,2}$/i)) {
      pushByte(opcode);
      value = parseInt(param.replace(/^\$/, ""), 16);
      if (value < 0 || value > 255) { return false; }
      pushByte(value);
      return true;
    }
    if (param.match(/^[0-9]{1,3}$/i)) {
      value = parseInt(param, 10);
      if (value < 0 || value > 255) { return false; }
      pushByte(opcode);
      pushByte(value);
      return true;
    }
    return false;
  }

  // checkAbsoluteX() - Check if param is ABSX and push value
  function checkAbsoluteX(param, opcode) {
    var number, value, addr;
    if (opcode === null) { return false; }
    if (param.match(/^\$[0-9a-f]{3,4},X$/i)) {
      pushByte(opcode);
      number = param.replace(/^\$([0-9a-f]*),X/i, "$1");
      value = parseInt(number, 16);
      if (value < 0 || value > 0xffff) { return false; }
      pushWord(value);
      return true;
    }

    if (param.match(/^\w+,X$/i)) {
      param = param.replace(/,X$/i, "");
      pushByte(opcode);
      if (labels.find(param)) {
        addr = labels.getPC(param);
        if (addr < 0 || addr > 0xffff) { return false; }
        pushWord(addr);
        return true;
      } else {
        pushWord(0x1234);
        return true;
      }
    }

    return false;
  }

  // checkAbsoluteY() - Check if param is ABSY and push value
  function checkAbsoluteY(param, opcode) {
    var number, value, addr;
    if (opcode === null) { return false; }
    if (param.match(/^\$[0-9a-f]{3,4},Y$/i)) {
      pushByte(opcode);
      number = param.replace(/^\$([0-9a-f]*),Y/i, "$1");
      value = parseInt(number, 16);
      if (value < 0 || value > 0xffff) { return false; }
      pushWord(value);
      return true;
    }

    // it could be a label too..

    if (param.match(/^\w+,Y$/i)) {
      param = param.replace(/,Y$/i, "");
      pushByte(opcode);
      if (labels.find(param)) {
        addr = labels.getPC(param);
        if (addr < 0 || addr > 0xffff) { return false; }
        pushWord(addr);
        return true;
      } else {
        pushWord(0x1234);
        return true;
      }
    }
    return false;
  }

  // checkZeroPageX() - Check if param is ZPX and push value
  function checkZeroPageX(param, opcode) {
    var number, value;
    if (opcode === null) { return false; }
    if (param.match(/^\$[0-9a-f]{1,2},X/i)) {
      pushByte(opcode);
      number = param.replace(/^\$([0-9a-f]{1,2}),X/i, "$1");
      value = parseInt(number, 16);
      if (value < 0 || value > 255) { return false; }
      pushByte(value);
      return true;
    }
    if (param.match(/^[0-9]{1,3},X/i)) {
      pushByte(opcode);
      number = param.replace(/^([0-9]{1,3}),X/i, "$1");
      value = parseInt(number, 10);
      if (value < 0 || value > 255) { return false; }
      pushByte(value);
      return true;
    }
    return false;
  }

  function checkZeroPageY(param, opcode) {
    var number, value;
    if (opcode === null) { return false; }
    if (param.match(/^\$[0-9a-f]{1,2},Y/i)) {
      pushByte(opcode);
      number = param.replace(/^\$([0-9a-f]{1,2}),Y/i, "$1");
      value = parseInt(number, 16);
      if (value < 0 || value > 255) { return false; }
      pushByte(value);
      return true;
    }
    if (param.match(/^[0-9]{1,3},Y/i)) {
      pushByte(opcode);
      number = param.replace(/^([0-9]{1,3}),Y/i, "$1");
      value = parseInt(number, 10);
      if (value < 0 || value > 255) { return false; }
      pushByte(value);
      return true;
    }
    return false;
  }

  // checkAbsolute() - Check if param is ABS and push value
  function checkAbsolute(param, opcode) {
    var value, number, addr;
    if (opcode === null) { return false; }
    pushByte(opcode);
    if (param.match(/^\$[0-9a-f]{3,4}$/i)) {
      value = parseInt(param.replace(/^\$/, ""), 16);
      if (value < 0 || value > 0xffff) { return false; }
      pushWord(value);
      return true;
    }
    if (param.match(/^[0-9]{1,5}$/i)) {  // Thanks, Matt!
      value = parseInt(param, 10);
      if (value < 0 || value > 0xffff) { return false; }
      pushWord(value);
      return(true);
    }
    // it could be a label too..
    if (param.match(/^\w+$/)) {
      if (labels.find(param)) {
        addr = (labels.getPC(param));
        if (addr < 0 || addr > 0xffff) { return false; }
        pushWord(addr);
        return true;
      } else {
        pushWord(0x1234);
        return true;
      }
    }
    return false;
  }

  // pushByte() - Push byte to memory
  function pushByte(value) {
    memory.set(defaultCodePC, value & 0xff);
    defaultCodePC++;
    codeLen++;
  }

  // pushWord() - Push a word using pushByte twice
  function pushWord(value) {
    pushByte(value & 0xff);
    pushByte((value >> 8) & 0xff);
  }

  function openPopup(content, title) {
    var w = window.open('', title, 'width=500,height=300,resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no,status=no');

    var html = "<html><head>";
    html += "<link href='style.css' rel='stylesheet' type='text/css' />";
    html += "<title>" + title + "</title></head><body>";
    html += "<pre><code>";

    html += content;

    html += "</code></pre></body></html>";
    w.document.write(html);
    w.document.close();
  }

  // hexDump() - Dump binary as hex to new window
  function hexdump() {
    openPopup(memory.format(0x600, codeLen), 'Hexdump');
  }

  // TODO: Create separate disassembler object?

  function getModeAndCode(byte) {
    var index;
    var line = OP_CODES.filter(function (line) {
      var possibleIndex = line.indexOf(byte);
      if (possibleIndex > -1) {
        index = possibleIndex;
        return true;
      }
    })[0];

    if (!line) { //instruction not found
      return {
        opCode: '???',
        mode: 'SNGL'
      };
    } else {
      return {
        opCode: line[0],
        mode: addressingModes[index]
      };
    }
  }

  function createInstruction(address) {
    var bytes = [];
    var opCode;
    var args = [];
    var mode;

    function isAccumulatorInstruction() {
      var accumulatorBytes = [0x0a, 0x4a, 0x2a, 0x6a];
      if (accumulatorBytes.indexOf(bytes[0]) > -1) {
        return true;
      }
    }

    function isBranchInstruction() {
      return opCode.match(/^B/) && !(opCode == 'BIT' || opCode == 'BRK');
    }

    //This is gnarly, but unavoidably so?
    function formatArguments() {
      var argsString = args.map(num2hex).reverse().join('');

      if (isBranchInstruction()) {
        var destination = address + 2;
        if (args[0] > 0x7f) {
          destination -= 0x100 - args[0];
        } else {
          destination += args[0];
        }
        argsString = addr2hex(destination);
      }

      if (argsString) {
        argsString = '$' + argsString;
      }
      if (mode == 'Imm') {
        argsString = '#' + argsString;
      }
      if (mode.match(/X$/)) {
        argsString += ',X';
      }
      if (mode.match(/^IND/)) {
        argsString = '(' + argsString + ')';
      }
      if (mode.match(/Y$/)) {
        argsString += ',Y';
      }

      if (isAccumulatorInstruction()) {
        argsString = 'A';
      }

      return argsString;
    }

    return {
      addByte: function (byte) {
        bytes.push(byte);
      },
      setModeAndCode: function (modeAndCode) {
        opCode = modeAndCode.opCode;
        mode = modeAndCode.mode;
      },
      addArg: function (arg) {
        args.push(arg);
      },
      toString: function () {
        var bytesString = bytes.map(num2hex).join(' ');
        var padding = Array(11 - bytesString.length).join(' ');
        return '$' + addr2hex(address) + '    ' + bytesString + padding + opCode +
          ' ' + formatArguments(args);
      }
    };
  }

  function disassemble() {
    var startAddress = 0x600;
    var currentAddress = startAddress;
    var endAddress = startAddress + codeLen;
    var instructions = [];
    var length;
    var inst;
    var byte;
    var modeAndCode;

    while (currentAddress < endAddress) {
      inst = createInstruction(currentAddress);
      byte = memory.get(currentAddress);
      inst.addByte(byte);

      modeAndCode = getModeAndCode(byte);
      length = INSTRUCTION_LENGTH[modeAndCode.mode];
      inst.setModeAndCode(modeAndCode);

      for (var i = 1; i < length; i++) {
        currentAddress++;
        byte = memory.get(currentAddress);
        inst.addByte(byte);
        inst.addArg(byte);
      }
      instructions.push(inst);
      currentAddress++;
    }

    var html = 'Address  Hexdump   Dissassembly\n';
    html +=    '-------------------------------\n';
    html += instructions.join('\n');
    openPopup(html, 'Disassembly');
  }

  return {
    assembleLine,
    assembleCode,
    getCurrentPC: function () {
      return defaultCodePC;
    },
    hexdump,
    disassemble,
  };
}

export default Assembler;
