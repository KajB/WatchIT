import { Injectable } from "angular2/core";
import { Response } from "angular2/http";

import { Observable, Observer, Subscription } from 'rxjs';
import 'rxjs/Rx';

import { AppSettings } from '../config';

export interface TmdbApiCallInfo {
    name: string;
    subscription: Subscription;
}

@Injectable()
export class TmdbApiService {
    private callInformation: TmdbApiCallInfo[] = [];
    constructor() {

    }

    register(callInfo: TmdbApiCallInfo) {
        let existingCallInfo = this.callInformation.find(x => x.name == callInfo.name);
        if (existingCallInfo != null) {
            if (!existingCallInfo.subscription.isUnsubscribed) {
                callInfo.subscription.unsubscribe();
            } else {
                existingCallInfo.subscription = callInfo.subscription;
            }
        } else {
            this.callInformation.push(callInfo);
        }
    }

    subscribe(name: string, stagedRequest: Observable<any>, subscribeOnNext: (data: any) => void, subscribeOnError?: (error: any) => void, subscribeOnComplete?: () => void) {
        let subscription = stagedRequest.subscribe(
            (data) => {

                subscribeOnNext(data);
            },
            (error) => {

                if (subscribeOnError != null) {
                    subscribeOnError(error);
                }
            },
            () => {

                if (subscribeOnComplete != null) {
                    subscribeOnComplete();
                }
            }); 

        this.register({
            name: name,
            subscription: subscription
        });
    }
}
