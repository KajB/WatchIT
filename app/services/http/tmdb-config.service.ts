import { Injectable } from "angular2/core";
import { Http } from "angular2/http";
import { Storage, LocalStorage } from "ionic-angular";

import { Observable, Observer } from 'rxjs';
import 'rxjs/Rx';

import { AppSettings } from '../../config';
import { TmdbConfigResponse } from '../../models/tmdb-responses.model';

@Injectable()
export class TmdbConfigService {
    private storage: Storage;
    private tmdbConfigObserver: Observer<TmdbConfigResponse>;

    tmdbConfig$: Observable<TmdbConfigResponse>;

    constructor(private http: Http) {
        this.storage = new Storage(LocalStorage);

        this.tmdbConfig$ = new Observable(observer => this.tmdbConfigObserver = observer).share();
    }

    load() {
        this.storage.get("tmdb_config")
                    .then(tmdbconfig => {
                        if (tmdbconfig == null) {
                            let uri: string = AppSettings.TMDB_BASEURI + "/configuration?api_key=" + AppSettings.TMDB_APIKEY;
                            this.http.get(uri)
                                     .map(response => response.json())
                                     .subscribe((data : TmdbConfigResponse) => {
                                        this.storage.set("tmdb_config", JSON.stringify(data));
                                        this.tmdbConfigObserver.next(data);
                                     });
                        } else {
                            this.tmdbConfigObserver.next(JSON.parse(tmdbconfig));
                        }
                    }, err => {
                        console.error("Cannot access local storage")
                    });
    }
}
