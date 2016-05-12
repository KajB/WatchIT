export class AppSettings {
    public static get TMDB_BASEURI(): string {
        return 'https://api.themoviedb.org/3';
    }

    public static get TMDB_APIKEY(): string {
        return 'a30696a02bd9bb6a44684b0d6818392d';
    }

    public static get OMDB_BASEURI(): string {
        return 'http://www.omdbapi.com/?';
    }
}
