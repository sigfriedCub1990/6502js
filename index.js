import { SimulatorWidget } from './modules';

$(document).ready(function () {
  var $node = $('.widget');
  window.$node = $node;
  SimulatorWidget($node);
});
