import { Injectable } from "angular2/core";
import { Http, Response } from "angular2/http";
import { Observable, Observer } from 'rxjs';
import 'rxjs/Rx';

import { AppSettings } from '../../config';
import { TmdbResponse, TmdbBaseMovieResponse } from '../../models/tmdb-responses.model';

import { TmdbApiService, TmdbApiCallInfo } from '../tmdb-api.service';

import { getName } from '../../app';

interface MovieDatastore {
    name: string;
    responses: TmdbBaseMovieResponse[];
    pages: number[];
}

@Injectable()
export class TmdbMoviesService {
    private tmdbPopularMoviesObserver: Observer<TmdbBaseMovieResponse[]>;
    private dataStore: MovieDatastore[];

    tmdbPopularMovies$: Observable<TmdbBaseMovieResponse[]>;

    constructor(private http: Http, private tmdbApiService: TmdbApiService) {
        this.dataStore = [];

        this.tmdbPopularMovies$ = new Observable(observer => this.tmdbPopularMoviesObserver = observer).share();
    }

    loadPopular(page?: number, language?: string) : Observable<Response> {
        let uri: string = AppSettings.TMDB_BASEURI + "/movie/popular?api_key=" + AppSettings.TMDB_APIKEY;

        if (page) {
            uri += ("&page=" + page);
        }

        if (language) {
            uri += ("&language=" + language);
        }

        let name = getName(() => this.loadPopular);
        let request$ = this.http.get(uri).share();
        let mapping$ = request$.map(response => response.json());
        this.tmdbApiService.subscribe(name, mapping$, (data: TmdbResponse<TmdbBaseMovieResponse>) => {
            if (data == null) {
                return;
            }

            let datastoreEntry = this.getDataStoreEntry(name);

            for (let result of data.results) {
                let contains: boolean = datastoreEntry.responses.find(x => x.id == result.id) != null;
                if (contains) {
                    continue;
                }

                datastoreEntry.responses.push(result);
            }

            this.tmdbPopularMoviesObserver.next(datastoreEntry.responses);
            datastoreEntry.pages.push(page == null ? 1 : page);
        });

        return request$;
    }

    /**
      * Loads the next page of the given function of this TMDB API. The next page is based on recieved data
      * within a session. Returns an observable of the ongoing request.
      * Examples of correct calls:
      * - If instance of service (named movieService) on 'this': let request$ = getNextPage(() => this.movieService.loadPopular);
      * - If instance of service (named movieService) in local variable: let request$ = getNextPage(() => movieService.loadPopular);
      * @param an anonymous function which contains the call to one of the functions on this service. For example,
      * if you have this service (named tmdbMovieService) as an instance variable, () => this.tmdbMovieService.loadPopular will suffice.
      */
    getNextPage(anonymousWithMethodCall: any) : Observable<Response> {
        let name = getName(anonymousWithMethodCall);
        if (this[name] == null) {
            return;
        }

        let nextPageNumber = this.getLastPage(name) + 1;
        return this[name](nextPageNumber);
    }

    private getLastPage(name: string): number {
        let datastoreEntry = this.dataStore.find(x => x.name == name);
        if (datastoreEntry == null) {
            return;
        }

        let uniquePages = datastoreEntry.pages.filter((value, index, self) => {
            return self.indexOf(value) === index;
        }).sort((a, b) => { return a - b });

        return uniquePages[uniquePages.length - 1];
    }

    private getDataStoreEntry(name: string) : MovieDatastore {
        let datastoreEntry = this.dataStore.find(x => x.name == name);
        if (datastoreEntry == null) {
            datastoreEntry = { name: name, responses: [], pages: [] };
            this.dataStore.push(datastoreEntry);
        }

        return datastoreEntry;
    }
}
