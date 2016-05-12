import { App, Platform } from 'ionic-angular';
import { StatusBar } from 'ionic-native';

import { HomePage } from './pages/home/home';

import { TmdbApiService } from './services/tmdb-api.service';
import { InfiniteScollerService } from './services/infinite-scroller.service';

@App({
    template: '<ion-nav [root]="rootPage"></ion-nav>',
    providers: [TmdbApiService, InfiniteScollerService],
    config: {}
})
export class MyApp {
    rootPage: any = HomePage;

    constructor(platform: Platform) {
        platform.ready().then(() => {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            StatusBar.styleDefault();
        });
    }
}

export function getName(obj: any): string {
    if (obj.name) {
        return obj.name;
    }

    var funcNameRegex = /function (.{1,})\(/;
    var results = (funcNameRegex).exec(obj.toString());
    var result = results && results.length > 1 && results[1];

    // Check to see custom implementation
    if (!result) {
        funcNameRegex = /return _this.(.*);/;
        results = (funcNameRegex).exec(obj.toString());
        result = results && results.length > 1 && results[1];
    }

    var indexOfDot = result.lastIndexOf('.');
    if (indexOfDot > 0) {
        result = result.substring(indexOfDot + 1, result.length);
    }

    return result || "";
}

export function findClosest(arr: number[], closestTo: number): number {
    var curr = arr[0];
    var diff = Math.abs(closestTo - curr);
    for (var val = 0; val < arr.length; val++) {
        var newdiff = Math.abs(closestTo - arr[val]);
        if (newdiff < diff) {
            diff = newdiff;
            curr = arr[val];
        }
    }
    return curr;
}
