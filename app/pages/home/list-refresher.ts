import { Component, Input } from 'angular2/core';

import { Draggable, DragAxis } from '../../directives/draggable';

@Component({
  selector: 'list-refresher',
  providers: [],
  directives: [Draggable],
  template:
  `
  <div style="position:relative; width: 160px; height: 100%;">
      <div style="background: black; height: inherit; width: inherit; position: absolute;"></div>
      <div draggable [axis]="axis" [minY]="0" [maxY]="0.7" [rollback]="true" [resistance]="false" style="background: green; height: 100%; width: 160px; position: absolute;"></div>
  </div>
  `,
  styles: [``]
})
export class ListRefresher {
    axis: DragAxis;

    constructor() {
      this.axis = DragAxis.x;
    }
}
