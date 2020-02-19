const STATES = Object.freeze({
  START : {
    assemble: true,
    run: [false, 'Run'],
    reset: false,
    hexdump: false,
    disassemble: false,
    debug: [false, false]
  },
  ASSEMBLED : {
    assemble: false,
    run: [true, 'Run'],
    reset: true,
    hexdump: true,
    disassemble: true,
    debug: [true, false]
  },
  RUNNING : {
    assemble: false,
    run: [true, 'Stop'],
    reset: true,
    hexdump: false,
    disassemble: false,
    debug: [true, false]
  },
  DEBUGGING : {
    assemble: false,
    reset: true,
    hexdump: true,
    disassemble: true,
    debug: [true, true]
  },
  POST_DEBUGGING : {
    assemble: false,
    reset: true,
    hexdump: true,
    disassemble: true,
    debug: [true, false]
  },
});

export default STATES;
