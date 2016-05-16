import { ViewChild } from "angular2/core";
import { Page, NavController, Content, Scroll } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';

import { ListRefresher } from './list-refresher';

import { TmdbConfigService } from '../../services/http/tmdb-config.service';
import { TmdbMoviesService } from '../../services/http/tmdb-movies.service';
import { InfiniteScollerService } from '../../services/infinite-scroller.service';

import { TmdbConfigResponse, TmdbBaseMovieResponse } from '../../models/tmdb-responses.model';

import { findClosest } from '../../app';

interface PosterPercentageItem {
    posterSize: string;
    size: number;
    percentage: number;
}

@Page({
    templateUrl: 'build/pages/home/home.html',
    directives: [ListRefresher],
    providers: [TmdbConfigService, TmdbMoviesService, InfiniteScollerService],
    queries: {
        popularscroller: new ViewChild('popularscroller'),
        maincontent: new ViewChild('maincontent')
    }
})
export class HomePage {
    @ViewChild('popularscroller') popularscroller: Scroll;
    @ViewChild('maincontent') maincontent: Content;

    private tmdbConfig: TmdbConfigResponse;

    popularMovies: Observable<TmdbBaseMovieResponse[]>;
    scrollHeight: number;
    imageHeight: number;
    posterWidth: string;

    constructor(private nav: NavController,
        private tmdbConfigService: TmdbConfigService,
        private tmdbMovieService: TmdbMoviesService,
        private scrollerService: InfiniteScollerService) {

    }

    ngOnInit() {
        this.tmdbConfigService.tmdbConfig$.subscribe(tmdbConfigResponse => {
            this.tmdbConfig = tmdbConfigResponse;
        });

        this.popularMovies = this.tmdbMovieService.tmdbPopularMovies$;

        this.tmdbConfigService.load();
        this.tmdbMovieService.loadPopular();
    }

    ngAfterViewInit() {
        this.scrollerService.register("popularScroller", this.popularscroller, () => {
            let request$ = this.tmdbMovieService.getNextPage(() => this.tmdbMovieService.loadPopular);
            request$.subscribe((response) => {

            });
        });

        setTimeout(() => {
            let screenHeight: number = this.maincontent.getNativeElement().clientHeight;
            let sizes: PosterPercentageItem[] = [];

            for (let i = 0; i < this.tmdbConfig.images.poster_sizes.length; i++) {
                let posterSize: string = this.tmdbConfig.images.poster_sizes[i];
                let size: number = +posterSize.substring(1, posterSize.length);
                let percentage: number = (size / screenHeight) * 100;

                if (!isNaN(percentage)) {
                    sizes.push({ percentage: percentage, posterSize: posterSize, size: size });
                }
            }

            var closestPercentage = findClosest(sizes.map(x => x.percentage), 40);
            this.posterWidth = sizes.find(x => x.percentage == closestPercentage).posterSize;
            this.imageHeight = this.scrollHeight = screenHeight * 0.4;
        }, 0);
    }

    protected getPosterPath(path: string) {
        return this.tmdbConfig.images.base_url + this.posterWidth + path;
    }

    protected getImageHeight() {
        return this.imageHeight;
    }
}
