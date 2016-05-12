interface TmdbBaseResultResponse {
    id: number,
    title: string,
    backdrop_path: string,
    poster_path: string
}

class TmdbConfigResponseImages {
    base_url: string;
    secure_base_url: string;
    backdrop_sizes: string[];
    logo_sizes: string[];
    poster_sizes: string[];
    profile_sizes: string[];
    still_sizes: string[];
}

export class TmdbConfigResponse {
    images: TmdbConfigResponseImages;
    change_keys: string[];
}

export class TmdbResponse<T extends TmdbBaseResultResponse> {
    page: number;
    results: Array<T>;
    total_pages: number;
    total_results: number;
}

export class TmdbBaseMovieResponse implements TmdbBaseResultResponse {
    adult: boolean;
    backdrop_path: string;
    genre_ids: Array<number>;
    id: number;
    original_language: string;
    original_title: string;
    overview: string;
    release_date: Date;
    poster_path: string;
    popularity: number;
    title: string;
    video: boolean;
    vote_average: number;
    vote_count: number;
}
