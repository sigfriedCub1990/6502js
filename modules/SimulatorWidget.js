import UI from './UI';
import Assembler from './Assembler';
import Display from './Display';
import Memory from './Memory';
import Simulator from './Simulator';
import Labels from './Labels';

import { addr2hex, num2hex, message } from './utils';

function SimulatorWidget(node) {
  var $node = $(node);
  var ui = UI();
  var display = Display();
  var memory = Memory();
  var labels = Labels();
  var simulator = Simulator();
  var assembler = Assembler();

  window.ui = ui;
  window.display = display;
  window.memory = memory;
  window.simulator = simulator;
  window.assembler = assembler;
  window.labels = labels;

  function initialize() {
    stripText();
    ui.initialize();
    display.initialize();
    simulator.reset();

    $node.find('.assembleButton').click(function () {
      assembler.assembleCode();
    });
    $node.find('.runButton').click(simulator.runBinary);
    $node.find('.runButton').click(simulator.stopDebugger);
    $node.find('.resetButton').click(simulator.reset);
    $node.find('.hexdumpButton').click(assembler.hexdump);
    $node.find('.disassembleButton').click(assembler.disassemble);
    $node.find('.debug').change(function () {
      var debug = $(this).is(':checked');
      if (debug) {
        ui.debugOn();
        simulator.enableDebugger();
      } else {
        ui.debugOff();
        simulator.stopDebugger();
      }
    });
    $node.find('.monitoring').change(function () {
      ui.toggleMonitor();
      simulator.toggleMonitor();
    });
    $node.find('.stepButton').click(simulator.debugExec);
    $node.find('.gotoButton').click(simulator.gotoAddr);
    $node.find('.notesButton').click(ui.showNotes);
    $node.find('.code').keypress(simulator.stop);
    $node.find('.code').keypress(ui.initialize);
    $(document).keypress(memory.storeKeypress);
  }

  function stripText() {
    //Remove leading and trailing space in textarea
    var text = $node.find('.code').val();
    text = text.replace(/^\n+/, '').replace(/\s+$/, '');
    $node.find('.code').val(text);
  }

  initialize();
}

export default SimulatorWidget;
