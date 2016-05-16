import { Directive, OnInit, Input, Output, EventEmitter, ElementRef, Renderer } from 'angular2/core';
import { BrowserDomAdapter } from 'angular2/platform/browser';
import { Observable } from 'rxjs'

export enum DragAxis {
    x,
    y,
    xy
}

export interface DragEvent {
    target: EventTarget,
    origin: DragPosition,
    delta: DragDelta,
    degrees: number
}

export interface DragErrorEvent {
    target: EventTarget,
    origin: DragPosition,
    message: string
}

export interface DragEndEvent {
    target: EventTarget,
    origin: DragPosition,
    delta: DragDelta
}

export interface DragDelta {
    x: number,
    y: number
}

interface DragSequence {
    target: EventTarget,
    origin: DragPosition,
    individualDrags: Observable<DragPosition>
}

interface Position {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
}

class DragPosition implements Position {
    left: number;
    top: number;
}

@Directive({
    selector: '[draggable]',
    providers: [BrowserDomAdapter],
    host: {
        '(mousedown)': 'onMousedown($event)',
        '(document:mousemove)': 'onMousemove($event)',
        '(document:mouseup)': 'onMouseup($event)',
        '(touchstart)': 'onTouchstart($event)',
        '(document:touchmove)': 'onTouchmove($event)',
        '(document:touchend)': 'onTouchend($event)'
    }
})
export class Draggable implements OnInit {
    @Input('axis') axis: DragAxis;
    @Input('revert') revert: boolean = false;
    @Input('revertDuration') revertDuration: number = 500;
    @Input('resistance') resistance: boolean = false;
    @Input('minX') minX: number = -Infinity;
    @Input('maxX') maxX: number = Infinity;
    @Input('minY') minY: number = -Infinity;
    @Input('maxY') maxY: number = Infinity;
    @Output('onDrag') onDrag = new EventEmitter();
    @Output('onDragEnd') onDragEnd = new EventEmitter();
    @Output('onDragError') onDragError = new EventEmitter();
    @Output('onRevertEnd') onRevertEnd = new EventEmitter();

    mouseup = new EventEmitter<MouseEvent>();
    mousedown = new EventEmitter<MouseEvent>();
    mousemove = new EventEmitter<MouseEvent>();

    touchend = new EventEmitter<TouchEvent>();
    touchstart = new EventEmitter<TouchEvent>();
    touchmove = new EventEmitter<TouchEvent>();

    dragSequence$: Observable<DragSequence>;

    onMouseup(event) {
        this.mouseup.emit(event);
    }

    onMousedown(event) {
        this.mousedown.emit(event);
        return false;
    }

    onMousemove(event) {
        this.mousemove.emit(event);
    }

    onTouchend(event) {
        this.touchend.emit(event);
    }

    onTouchstart(event) {
        this.touchstart.emit(event);
        return false;
    }

    onTouchmove(event) {
        this.touchmove.emit(event);
    }

    constructor(private element: ElementRef, private adapter: BrowserDomAdapter, private renderer: Renderer) {
        this.revertDuration = this.revertDuration / 1000;

        let downPosition: (event: any) => DragPosition = (event) => {
            return this.calcPos(event, this.adapter.getBoundingClientRect(this.element.nativeElement));
        };

        let movePosition: (event: any, offset: DragPosition) => DragPosition = (event, offset) => {
            return this.calcPos(event, offset);
        };

        let withinBounds: (position: DragPosition) => boolean = (position) => {
            let boundingRect = this.adapter.getBoundingClientRect(this.element.nativeElement);

            if (this.axis == DragAxis.x) {
                let minX = this.minX > 0 && this.minX < 1 ? boundingRect.width * this.minX : this.minX,
                    maxX = this.maxX > 0 && this.maxX < 1 ? boundingRect.width * this.maxX : this.maxX;

                return (position.left >= minX && position.left <= maxX);
            } else if (this.axis == DragAxis.y) {
                let minY = this.minY > 0 && this.minY < 1 ? boundingRect.height * this.minY : this.minY,
                    maxY = this.maxY > 0 && this.maxY < 1 ? boundingRect.height * this.maxY : this.maxY;

                return (position.top >= minY && position.top <= maxY);
            } else {
                return true;
            }
        };

        let mouseDrag = this.mousedown.map(downEvent => {
            var position = downPosition(downEvent);
            return {
                target: downEvent.target,
                origin: position,
                individualDrags: this.mousemove
                    .map(moveEvent => movePosition(moveEvent, position))
                    .takeWhile(withinBounds)
                    .takeUntil(this.mouseup)
            }
        });

        let touchDrag = this.touchstart.map(downEvent =>{
            var position = downPosition(downEvent);
            return {
                target: downEvent.target,
                origin: position,
                individualDrags: this.touchmove
                    .map(moveEvent => movePosition(moveEvent, position))
                    .takeWhile(withinBounds)
                    .takeUntil(this.touchend)
            }
        });

        this.dragSequence$ = Observable.merge(mouseDrag, touchDrag);
    }

    ngOnInit() {
        this.dragSequence$.subscribe(dragSequence => {
            let latestPosition: DragPosition;
            let originalPosition: Position = this.pos();

            let onDrag = (drag: DragPosition) => {
                this.onDrag.emit({
                    target: dragSequence.target,
                    origin: dragSequence.origin,
                    delta: drag,
                    degrees: Math.atan2(drag.top, drag.left) / Math.PI * 360
                });

                latestPosition = drag;

                this.move(drag, originalPosition);
            };

            let onDragError = (dragError: DragPosition) => {
                this.onDragError.emit({
                    target: dragSequence.target,
                    origin: dragSequence.origin,
                    message: 'An error occured'
                });
            };

            let onDragCompleted = () => {
                this.onDragEnd.emit({
                    target: dragSequence.target,
                    origin: dragSequence.origin,
                    delta: latestPosition
                });

                if (this.revert) {
                    this.adapter.on(this.element.nativeElement, 'transitionend', () => {
                        this.onRevertEnd.emit({


                        });
                        this.renderer.setElementStyle(this.element.nativeElement, 'transition', '');
                    });

                    this.renderer.setElementStyle(this.element.nativeElement, 'transition', ('top ' + this.revertDuration + 's'));
                    this.renderer.setElementStyle(this.element.nativeElement, 'top', '0px');
                }
            };

            dragSequence.individualDrags.subscribe(onDrag, onDragError, onDragCompleted);
        });
    }

    private move(currentPosition: DragPosition, originalPosition: Position) {
        let position: DragPosition = currentPosition;
        if (this.resistance) {
            position.top = position.top * (0.7 - (Math.sqrt(Math.pow((position.left - originalPosition.left), 2) + Math.pow((position.top - originalPosition.top), 2)) / 1000));
            position.left = position.left * (0.7 - (Math.sqrt(Math.pow((position.left - originalPosition.left), 2) + Math.pow((position.top - originalPosition.top), 2)) / 1000));
        }

        if (this.axis == DragAxis.x) {
            this.renderer.setElementStyle(this.element.nativeElement, 'left', position.left + 'px');
        } else if (this.axis == DragAxis.y) {
            this.renderer.setElementStyle(this.element.nativeElement, 'top', position.top + 'px');
        } else {
            this.renderer.setElementStyle(this.element.nativeElement, 'top', position.top + 'px');
            this.renderer.setElementStyle(this.element.nativeElement, 'left', position.left + 'px');
        }
    }

    private pos() : Position {
        let position: Position = {
            top: this.adapter.getProperty(this.element.nativeElement, 'offsetTop'),
            left:  this.adapter.getProperty(this.element.nativeElement, 'offsetLeft')
        }

        return position;
    }

    private calcPos(e: any, pos: DragPosition): DragPosition {
        return {
            top: this.yPos(e) - pos.top,
            left: this.xPos(e) - pos.left
        };
    }

    private yPos(e): number {
        if (e.targetTouches && (e.targetTouches.length >= 1)) {
            return e.targetTouches[0].clientY;
        }

        return e.clientY;
    }

    private xPos(e): number {
        if (e.targetTouches && (e.targetTouches.length >= 1)) {
            return e.targetTouches[0].clientX;
        }

        return e.clientX;
    }
}
