import STATES from './constants/states';

function UI() {
  var currentState;

  function setState(state) {
    $node.find('.assembleButton').attr('disabled', !state.assemble);
    if (state.run) {
      $node.find('.runButton').attr('disabled', !state.run[0]);
      $node.find('.runButton').val(state.run[1]);
    }
    $node.find('.resetButton').attr('disabled', !state.reset);
    $node.find('.hexdumpButton').attr('disabled', !state.hexdump);
    $node.find('.disassembleButton').attr('disabled', !state.disassemble);
    $node.find('.debug').attr('disabled', !state.debug[0]);
    $node.find('.debug').attr('checked', state.debug[1]);
    $node.find('.stepButton').attr('disabled', !state.debug[1]);
    $node.find('.gotoButton').attr('disabled', !state.debug[1]);
    currentState = state;
  }

  function initialize() {
    setState(STATES.START);
  }

  function play() {
    setState(STATES.RUNNING);
  }

  function stop() {
    setState(STATES.ASSEMBLED);
  }

  function debugOn() {
    setState(STATES.DEBUGGING);
  }

  function debugOff() {
    setState(STATES.POST_DEBUGGING);
  }

  function assembleSuccess() {
    setState(STATES.ASSEMBLED);
  }

  function toggleMonitor() {
    $node.find('.monitor').toggle();
  }

  function showNotes() {
    $node.find('.messages code').html($node.find('.notes').html());
  }

  return {
    initialize,
    play,
    stop,
    assembleSuccess,
    debugOn,
    debugOff,
    toggleMonitor,
    showNotes,
  };
}

export default UI;
