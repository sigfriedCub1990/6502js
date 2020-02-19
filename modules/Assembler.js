import { addr2hex, num2hex, message, stripText } from './utils';

function Assembler() {
  var defaultCodePC;
  var codeLen;
  var codeAssembledOK = false;

  var Opcodes = [
    /* Name, Imm,  ZP,   ZPX,  ZPY,  ABS, ABSX, ABSY,  IND, INDX, INDY, SNGL, BRA */
    ["ADC", 0x69, 0x65, 0x75, null, 0x6d, 0x7d, 0x79, null, 0x61, 0x71, null, null],
    ["AND", 0x29, 0x25, 0x35, null, 0x2d, 0x3d, 0x39, null, 0x21, 0x31, null, null],
    ["ASL", null, 0x06, 0x16, null, 0x0e, 0x1e, null, null, null, null, 0x0a, null],
    ["BIT", null, 0x24, null, null, 0x2c, null, null, null, null, null, null, null],
    ["BPL", null, null, null, null, null, null, null, null, null, null, null, 0x10],
    ["BMI", null, null, null, null, null, null, null, null, null, null, null, 0x30],
    ["BVC", null, null, null, null, null, null, null, null, null, null, null, 0x50],
    ["BVS", null, null, null, null, null, null, null, null, null, null, null, 0x70],
    ["BCC", null, null, null, null, null, null, null, null, null, null, null, 0x90],
    ["BCS", null, null, null, null, null, null, null, null, null, null, null, 0xb0],
    ["BNE", null, null, null, null, null, null, null, null, null, null, null, 0xd0],
    ["BEQ", null, null, null, null, null, null, null, null, null, null, null, 0xf0],
    ["BRK", null, null, null, null, null, null, null, null, null, null, 0x00, null],
    ["CMP", 0xc9, 0xc5, 0xd5, null, 0xcd, 0xdd, 0xd9, null, 0xc1, 0xd1, null, null],
    ["CPX", 0xe0, 0xe4, null, null, 0xec, null, null, null, null, null, null, null],
    ["CPY", 0xc0, 0xc4, null, null, 0xcc, null, null, null, null, null, null, null],
    ["DEC", null, 0xc6, 0xd6, null, 0xce, 0xde, null, null, null, null, null, null],
    ["EOR", 0x49, 0x45, 0x55, null, 0x4d, 0x5d, 0x59, null, 0x41, 0x51, null, null],
    ["CLC", null, null, null, null, null, null, null, null, null, null, 0x18, null],
    ["SEC", null, null, null, null, null, null, null, null, null, null, 0x38, null],
    ["CLI", null, null, null, null, null, null, null, null, null, null, 0x58, null],
    ["SEI", null, null, null, null, null, null, null, null, null, null, 0x78, null],
    ["CLV", null, null, null, null, null, null, null, null, null, null, 0xb8, null],
    ["CLD", null, null, null, null, null, null, null, null, null, null, 0xd8, null],
    ["SED", null, null, null, null, null, null, null, null, null, null, 0xf8, null],
    ["INC", null, 0xe6, 0xf6, null, 0xee, 0xfe, null, null, null, null, null, null],
    ["JMP", null, null, null, null, 0x4c, null, null, 0x6c, null, null, null, null],
    ["JSR", null, null, null, null, 0x20, null, null, null, null, null, null, null],
    ["LDA", 0xa9, 0xa5, 0xb5, null, 0xad, 0xbd, 0xb9, null, 0xa1, 0xb1, null, null],
    ["LDX", 0xa2, 0xa6, null, 0xb6, 0xae, null, 0xbe, null, null, null, null, null],
    ["LDY", 0xa0, 0xa4, 0xb4, null, 0xac, 0xbc, null, null, null, null, null, null],
    ["LSR", null, 0x46, 0x56, null, 0x4e, 0x5e, null, null, null, null, 0x4a, null],
    ["NOP", null, null, null, null, null, null, null, null, null, null, 0xea, null],
    ["ORA", 0x09, 0x05, 0x15, null, 0x0d, 0x1d, 0x19, null, 0x01, 0x11, null, null],
    ["TAX", null, null, null, null, null, null, null, null, null, null, 0xaa, null],
    ["TXA", null, null, null, null, null, null, null, null, null, null, 0x8a, null],
    ["DEX", null, null, null, null, null, null, null, null, null, null, 0xca, null],
    ["INX", null, null, null, null, null, null, null, null, null, null, 0xe8, null],
    ["TAY", null, null, null, null, null, null, null, null, null, null, 0xa8, null],
    ["TYA", null, null, null, null, null, null, null, null, null, null, 0x98, null],
    ["DEY", null, null, null, null, null, null, null, null, null, null, 0x88, null],
    ["INY", null, null, null, null, null, null, null, null, null, null, 0xc8, null],
    ["ROR", null, 0x66, 0x76, null, 0x6e, 0x7e, null, null, null, null, 0x6a, null],
    ["ROL", null, 0x26, 0x36, null, 0x2e, 0x3e, null, null, null, null, 0x2a, null],
    ["RTI", null, null, null, null, null, null, null, null, null, null, 0x40, null],
    ["RTS", null, null, null, null, null, null, null, null, null, null, 0x60, null],
    ["SBC", 0xe9, 0xe5, 0xf5, null, 0xed, 0xfd, 0xf9, null, 0xe1, 0xf1, null, null],
    ["STA", null, 0x85, 0x95, null, 0x8d, 0x9d, 0x99, null, 0x81, 0x91, null, null],
    ["TXS", null, null, null, null, null, null, null, null, null, null, 0x9a, null],
    ["TSX", null, null, null, null, null, null, null, null, null, null, 0xba, null],
    ["PHA", null, null, null, null, null, null, null, null, null, null, 0x48, null],
    ["PLA", null, null, null, null, null, null, null, null, null, null, 0x68, null],
    ["PHP", null, null, null, null, null, null, null, null, null, null, 0x08, null],
    ["PLP", null, null, null, null, null, null, null, null, null, null, 0x28, null],
    ["STX", null, 0x86, null, 0x96, 0x8e, null, null, null, null, null, null, null],
    ["STY", null, 0x84, 0x94, null, 0x8c, null, null, null, null, null, null, null],
    ["---", null, null, null, null, null, null, null, null, null, null, null, null]
  ];

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


    for (var o = 0; o < Opcodes.length; o++) {
      if (Opcodes[o][0] === command) {
        if (checkSingle(param, Opcodes[o][11])) { return true; }
        if (checkImmediate(param, Opcodes[o][1])) { return true; }
        if (checkZeroPage(param, Opcodes[o][2])) { return true; }
        if (checkZeroPageX(param, Opcodes[o][3])) { return true; }
        if (checkZeroPageY(param, Opcodes[o][4])) { return true; }
        if (checkAbsoluteX(param, Opcodes[o][6])) { return true; }
        if (checkAbsoluteY(param, Opcodes[o][7])) { return true; }
        if (checkIndirect(param, Opcodes[o][8])) { return true; }
        if (checkIndirectX(param, Opcodes[o][9])) { return true; }
        if (checkIndirectY(param, Opcodes[o][10])) { return true; }
        if (checkAbsolute(param, Opcodes[o][5])) { return true; }
        if (checkBranch(param, Opcodes[o][12])) { return true; }
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
  var addressingModes = [
    null,
    'Imm',
    'ZP',
    'ZPX',
    'ZPY',
    'ABS',
    'ABSX',
    'ABSY',
    'IND',
    'INDX',
    'INDY',
    'SNGL',
    'BRA'
  ];

  var instructionLength = {
    Imm: 2,
    ZP: 2,
    ZPX: 2,
    ZPY: 2,
    ABS: 3,
    ABSX: 3,
    ABSY: 3,
    IND: 3,
    INDX: 2,
    INDY: 2,
    SNGL: 1,
    BRA: 2
  };

  function getModeAndCode(byte) {
    var index;
    var line = Opcodes.filter(function (line) {
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
      length = instructionLength[modeAndCode.mode];
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
    assembleLine: assembleLine,
    assembleCode: assembleCode,
    getCurrentPC: function () {
      return defaultCodePC;
    },
    hexdump: hexdump,
    disassemble: disassemble
  };
}

export default Assembler;
