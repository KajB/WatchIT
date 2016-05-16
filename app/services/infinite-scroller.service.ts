import { Injectable } from "angular2/core";
import { Scroll } from 'ionic-angular';

export interface IScrollInformation {
    name: string;
    scroller: Scroll;
    limitPercentage: number;
    handler?: (event: any) => void;
    previousLimit?: number;
    limitReached?: boolean;
}

@Injectable()
export class InfiniteScollerService {
    private scrollInformation: IScrollInformation[] = [];
    constructor() {

    }

    register(name: string, ionScroller: Scroll, callback: () => void, limitPercentage: number = 0.92) {
        let scroller = this.scrollInformation.find(x => x.name == name);
        if (scroller == null) {
             scroller = { name: name, scroller: ionScroller, limitPercentage: limitPercentage };
             this.scrollInformation.push(scroller);
        }

        this.addInfiniteHandler(scroller, callback);
    }

    private addInfiniteHandler(scroller: IScrollInformation, limitReached: () => void) {
        if (scroller.handler == null) {
            scroller.handler = ($event) => {
                let currentLimit = $event.target.scrollWidth * scroller.limitPercentage;
                let currentPosition = $event.target.scrollLeft + $event.target.clientWidth;

                if (scroller.previousLimit != null) {
                    if (scroller.limitReached && scroller.previousLimit != currentLimit) {
                        scroller.limitReached = false;
                    }
                }

                if (currentPosition >= currentLimit) {
                    if (!scroller.limitReached) {
                        scroller.limitReached = true;
                        scroller.previousLimit = currentLimit;
                        limitReached();
                    }
                }
            };

            scroller.scroller.addScrollEventListener(scroller.handler);
        }
    }
}
