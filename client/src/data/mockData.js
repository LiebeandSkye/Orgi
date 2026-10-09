// mockData.js — Books / literature data for the "rate." platform

export const HOME_TRENDING_ITEMS = [
  {
    id: "interstellar",
    tmdbId: 157336,
    title: "Interstellar",
    year: "2014",
    rating: "8.7",
    poster: "https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    type: "MOVIE",
    route: "/movie/interstellar",
    isActive: true
  },
  {
    id: "dune-part-two",
    tmdbId: 693134,
    title: "Dune: Part Two",
    year: "2024",
    rating: "8.5",
    poster: "https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    type: "MOVIE",
    route: "/movie/dune-part-two",
    isActive: false
  },
  {
    id: "oppenheimer",
    tmdbId: 872585,
    title: "Oppenheimer",
    year: "2023",
    rating: "8.1",
    poster: "https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    type: "MOVIE",
    route: "/movie/oppenheimer",
    isActive: false
  },
  {
    id: "breaking-bad",
    tmdbId: 1396,
    title: "Breaking Bad",
    year: "2008",
    rating: "9.5",
    poster: "https://image.tmdb.org/t/p/w780/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg",
    type: "SERIES",
    route: "/series/breaking-bad",
    isActive: false
  },
  {
    id: "inception",
    tmdbId: 27205,
    title: "Inception",
    year: "2010",
    rating: "8.4",
    poster: "https://image.tmdb.org/t/p/w780/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    type: "MOVIE",
    route: "/movie/inception",
    isActive: false
  },
  {
    id: "the-dark-knight",
    tmdbId: 155,
    title: "The Dark Knight",
    year: "2008",
    rating: "8.5",
    poster: "https://image.tmdb.org/t/p/w780/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    type: "MOVIE",
    route: "/movie/the-dark-knight",
    isActive: false
  },
  {
    id: "better-call-saul",
    tmdbId: 60059,
    title: "Better Call Saul",
    year: "2015",
    rating: "8.7",
    poster: "https://image.tmdb.org/t/p/w780/fC2HDm5t0kHsf7TmFEeOx8q2umH.jpg",
    type: "SERIES",
    route: "/series/better-call-saul",
    isActive: false
  },
  {
    id: "parasite",
    tmdbId: 496243,
    title: "Parasite",
    year: "2019",
    rating: "8.5",
    poster: "https://image.tmdb.org/t/p/w780/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    type: "MOVIE",
    route: "/movie/parasite",
    isActive: false
  },
  {
    id: "severance",
    tmdbId: 95396,
    title: "Severance",
    year: "2022",
    rating: "8.4",
    poster: "https://image.tmdb.org/t/p/w780/p2fCFqHk1Y1f6bZ2qg700u6U2B7.jpg",
    type: "SERIES",
    route: "/series/severance",
    isActive: false
  },
  {
    id: "spider-man-across-the-spider-verse",
    tmdbId: 569094,
    title: "Across the Spider-Verse",
    year: "2023",
    rating: "8.4",
    poster: "https://image.tmdb.org/t/p/w780/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
    type: "MOVIE",
    route: "/movie/spider-man-across-the-spider-verse",
    isActive: false
  },
  {
    id: "your-name",
    tmdbId: 372058,
    title: "Your Name",
    year: "2016",
    rating: "8.4",
    poster: "https://image.tmdb.org/t/p/w780/q719jXXEzOoYaps6qFsR90qL4q.jpg",
    type: "MOVIE",
    route: "/movie/your-name",
    isActive: false
  },
  {
    id: "the-last-of-us",
    tmdbId: 100088,
    title: "The Last of Us",
    year: "2023",
    rating: "8.6",
    poster: "https://image.tmdb.org/t/p/w780/uKvVjF013yt44bNXk2gV89O80gW.jpg",
    type: "SERIES",
    route: "/series/the-last-of-us",
    isActive: false
  }
];

export const INTERSTELLAR_DATA = {
  id: "interstellar",
  tmdbId: 157336,
  type: "MOVIE",
  title: "Interstellar",
  year: "2014",
  genres: "Sci-Fi, Adventure",
  runtime: "2h 49m",
  certificate: "PG-13",
  tmdbRating: "8.7",
  tmdbVotes: "1.2M TMDB",
  communityRating: "8.9",
  communityVotes: "342 ratings",
  backdrop: "https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
  poster: "https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
  posterCaption: "Interstellar Official TMDB Poster",
  synopsis:
    "When Earth becomes uninhabitable in the near future, a former NASA pilot and farmer, Joseph Cooper, is recruited for a perilous interstellar expedition through a newly discovered wormhole near Saturn to find a viable new home for humankind.",
  details: {
    director: "Christopher Nolan",
    writers: "Jonathan Nolan, Christopher Nolan",
    cinematography: "Hoyte van Hoytema",
    music: "Hans Zimmer",
    boxOffice: "$773.8M USD",
    budget: "$165M USD",
    studio: "Paramount Pictures · Warner Bros. · Syncopy",
    aspectRatio: "2.39:1 (35mm) / 1.43:1 (IMAX 70mm)",
    releaseDate: "November 7, 2014 (USA)"
  },
  cast: [
    {
      id: "1",
      name: "Matthew McConaughey",
      character: "Joseph Cooper",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80"
    },
    {
      id: "2",
      name: "Anne Hathaway",
      character: "Dr. Amelia Brand",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80"
    },
    {
      id: "3",
      name: "Jessica Chastain",
      character: "Murphy 'Murph' Cooper",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=240&auto=format&fit=crop&q=80"
    },
    {
      id: "4",
      name: "Michael Caine",
      character: "Professor John Brand",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=240&auto=format&fit=crop&q=80"
    },
    {
      id: "5",
      name: "Matt Damon",
      character: "Dr. Mann",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80"
    },
    {
      id: "6",
      name: "Mackenzie Foy",
      character: "Young Murph",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&auto=format&fit=crop&q=80"
    },
    {
      id: "7",
      name: "Timothée Chalamet",
      character: "Young Tom",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=240&auto=format&fit=crop&q=80"
    },
    {
      id: "8",
      name: "John Lithgow",
      character: "Donald",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=240&auto=format&fit=crop&q=80"
    }
  ],
  reviews: [
    {
      id: "r1",
      author: "kierangallagher",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
      time: "2d ago",
      score: 9,
      content:
        "The dock sequence alone justifies the existence of cinema. Zimmer's pipe organ score relentlessly suffocates you before releasing tension with mathematical precision. Nolan at his most emotionally unshielded.",
      likes: 142,
      repliesCount: 3,
      replies: [
        {
          id: "rep1",
          author: "marcus_v",
          avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80",
          time: "1d ago",
          content: "That 55-beat-per-minute ticking during Miller's planet is absolute psychological torment in IMAX."
        },
        {
          id: "rep2",
          author: "elena_film",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
          time: "18h ago",
          content: "Agreed. The silence of the vacuum right after the airlock explosion is still unforgettable."
        },
        {
          id: "rep3",
          author: "astronomy_nerd",
          avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=120&auto=format&fit=crop&q=80",
          time: "5h ago",
          content: "Kip Thorne's gravitational lensing equations were published as real scientific papers from this film."
        }
      ]
    },
    {
      id: "r2",
      author: "sylvan_c",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
      time: "3d ago",
      score: 9,
      content:
        "Time dilation treated as an antagonist rather than a sci-fi gimmick. The video transmissions scene broke me in the theater ten years ago, and watching Cooper age backwards relative to his daughter still stings just as acutely.",
      likes: 98,
      repliesCount: 0
    },
    {
      id: "r3",
      author: "devon_cinematics",
      avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
      time: "5d ago",
      score: 8,
      content:
        "Hoyte van Hoytema's 65mm IMAX cinematography grounds cosmic abstraction in tactile industrial grit. The dust storms in Alberta feel choke-worthy; the ice clouds on Mann's planet feel freezing. Masterclass in scale.",
      likes: 74,
      repliesCount: 0
    },
    {
      id: "r4",
      author: "clara_o",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
      time: "1w ago",
      score: 10,
      content:
        "TARS and CASE remain the most refreshing robotic AI companions in modern science fiction. Monolithic geometry, zero anthropomorphic faces, yet packed with genuine utility and dry humor.",
      likes: 61,
      repliesCount: 0
    }
  ]
};

export const BREAKING_BAD_DATA = {
  id: "breaking-bad",
  tmdbId: 1396,
  type: "SERIES",
  title: "Breaking Bad",
  year: "2008–2013",
  genres: "Crime, Drama",
  seasonsCount: "5 seasons",
  episodesCount: "62 episodes",
  tmdbRating: "8.9",
  tmdbVotes: "14K TMDB",
  communityRating: "9.6",
  communityVotes: "890 ratings",
  backdrop: "https://image.tmdb.org/t/p/original/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
  poster: "https://image.tmdb.org/t/p/w780/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg",
  synopsis:
    "A diagnosed chemistry teacher turns to manufacturing methamphetamine with a former student to secure his family's financial future, steadily descending into the ruthless criminal underworld under the moniker Heisenberg.",
  episodes: [
    {
      number: "01",
      title: "Pilot",
      description: "Diagnosed with terminal lung cancer, chemistry teacher Walter White teams with former student Jesse Pinkman.",
      runtime: "58m",
      score: "8.9",
      thumbnail: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=320&auto=format&fit=crop&q=80",
      isHovered: true
    },
    {
      number: "02",
      title: "Cat's in the Bag...",
      description: "Walt and Jesse attempt to dispose of two bodies in an RV while dealing with unexpected complications.",
      runtime: "48m",
      score: "8.6",
      thumbnail: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=320&auto=format&fit=crop&q=80",
      isHovered: false
    },
    {
      number: "03",
      title: "...And the Bag's in the River",
      description: "Walt struggles with a moral crossroads as he bonds with Krazy-8 in Jesse's basement.",
      runtime: "48m",
      score: "8.7",
      thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=320&auto=format&fit=crop&q=80",
      isHovered: false
    },
    {
      number: "04",
      title: "Cancer Man",
      description: "Walt reveals his cancer diagnosis to his family; Jesse visits his estranged parents.",
      runtime: "48m",
      score: "8.2",
      thumbnail: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=320&auto=format&fit=crop&q=80",
      isHovered: false
    },
    {
      number: "05",
      title: "Gray Matter",
      description: "Walt rejects financial assistance from his wealthy former business partners.",
      runtime: "48m",
      score: "8.3",
      thumbnail: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=320&auto=format&fit=crop&q=80",
      isHovered: false
    },
    {
      number: "06",
      title: "Crazy Handful of Nothin'",
      description: "Walt shaves his head, adopts the Heisenberg moniker, and confronts drug lord Tuco Salamanca.",
      runtime: "48m",
      score: "9.3",
      thumbnail: "https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=320&auto=format&fit=crop&q=80",
      isHovered: false
    },
    {
      number: "07",
      title: "A No-Rough-Stuff-Type Deal",
      description: "Walt and Jesse make an ambitious agreement with Tuco, requiring a daring industrial chemical heist.",
      runtime: "47m",
      score: "8.8",
      thumbnail: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=320&auto=format&fit=crop&q=80",
      isHovered: false
    }
  ],
  details: {
    creator: "Vince Gilligan",
    writers: "Vince Gilligan, Peter Gould, Thomas Schnauz",
    network: "AMC",
    originalAirDates: "January 20, 2008 – September 29, 2013",
    studio: "High Bridge Productions · Gran Via Productions · Sony Pictures Television",
    awards: "16 Primetime Emmy Awards · 2 Golden Globes",
    cinematography: "Michael Slovis, Reynaldo Villalobos"
  },
  cast: [
    {
      id: "bb-1",
      name: "Bryan Cranston",
      character: "Walter White / Heisenberg",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80"
    },
    {
      id: "bb-2",
      name: "Aaron Paul",
      character: "Jesse Pinkman",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80"
    },
    {
      id: "bb-3",
      name: "Anna Gunn",
      character: "Skyler White",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=240&auto=format&fit=crop&q=80"
    },
    {
      id: "bb-4",
      name: "Dean Norris",
      character: "Hank Schrader",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=240&auto=format&fit=crop&q=80"
    },
    {
      id: "bb-5",
      name: "Betsy Brandt",
      character: "Marie Schrader",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80"
    },
    {
      id: "bb-6",
      name: "RJ Mitte",
      character: "Walter White Jr.",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=240&auto=format&fit=crop&q=80"
    },
    {
      id: "bb-7",
      name: "Bob Odenkirk",
      character: "Saul Goodman",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=240&auto=format&fit=crop&q=80"
    },
    {
      id: "bb-8",
      name: "Giancarlo Esposito",
      character: "Gustavo 'Gus' Fring",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&auto=format&fit=crop&q=80"
    }
  ],
  reviews: [
    {
      id: "bb-r1",
      author: "seriestheory",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
      time: "1d ago",
      score: 10,
      content:
        "Ozymandias remains the single greatest hour of serialized television ever broadcast. Walter White's slow transformation into Heisenberg is the definitive modern Shakespearean tragedy.",
      likes: 312,
      repliesCount: 4,
      replies: [
        {
          id: "bb-rep1",
          author: "bryan_fan",
          avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80",
          time: "18h ago",
          content: "The phone call scene where Walt clears Skyler in front of the police is pure acting perfection."
        }
      ]
    },
    {
      id: "bb-r2",
      author: "cinema_scope",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
      time: "3d ago",
      score: 10,
      content:
        "The visual motif of desert color-grading, chemical nomenclature, and Vince Gilligan's patient pacing set a gold standard that has never been matched since.",
      likes: 215,
      repliesCount: 0
    }
  ]
};

export const DUNE_SEARCH_DATA = {
  query: "dune",
  totalResults: 24,
  activeFilter: "All",
  filters: ["All", "Movies", "Series", "Books"],
  results: [
    {
      id: "dune-2021",
      title: "Dune",
      type: "MOVIE",
      year: "2021",
      genre: "Sci-Fi",
      director: "Denis Villeneuve",
      synopsis: "Paul Atreides arrives on Arrakis, a dangerous desert planet holding the universe's most precious spice resource.",
      score: "8.0",
      poster: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
      isHovered: true
    },
    {
      id: "dune-part-two",
      title: "Dune: Part Two",
      type: "MOVIE",
      year: "2024",
      genre: "Sci-Fi, Adventure",
      director: "Denis Villeneuve",
      synopsis: "Paul Atreides unites with Chani and the Fremen while seeking vengeance against the conspirators who destroyed his family.",
      score: "8.5",
      poster: "https://image.tmdb.org/t/p/w500/1pdfLvk8ke9cG919q9fd1tqnl4j.jpg",
      isHovered: false
    },
    {
      id: "dune-prophecy",
      title: "Dune: Prophecy",
      type: "SERIES",
      year: "2024–",
      genre: "Sci-Fi, Drama",
      director: "Alison Schapker",
      synopsis: "Set 10,000 years before Paul Atreides, two Harkonnen sisters combat forces threatening the future of humankind and establish the Bene Gesserit.",
      score: "7.7",
      poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80",
      isHovered: false
    },
    {
      id: "dune-book",
      title: "Dune",
      type: "BOOK",
      year: "1965",
      genre: "Novel · Sci-Fi",
      director: "Frank Herbert",
      synopsis: "The landmark masterwork of speculative fiction chronicling the fate of House Atreides on Arrakis.",
      score: "9.2",
      poster: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80",
      isHovered: false
    }
  ]
};

export const MANHWA_DATA = [
  {
    id: "m1",
    title: "Solo Leveling",
    author: "Chugong, DUBU",
    rating: "9.3",
    chapters: "Ch. 179",
    genre: "Action, Fantasy",
    status: "Completed",
    cover: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80",
    isHovered: true
  },
  {
    id: "m2",
    title: "Omniscient Reader's Viewpoint",
    author: "sing N song, Sleepy-C",
    rating: "9.4",
    chapters: "Ch. 214",
    genre: "Fantasy, Apocalyptic",
    status: "Ongoing",
    cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80",
    isHovered: false
  },
  {
    id: "m3",
    title: "Tower of God",
    author: "SIU",
    rating: "8.9",
    chapters: "Ch. 612",
    genre: "Mystery, Adventure",
    status: "Ongoing",
    cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
    isHovered: false
  },
  {
    id: "m4",
    title: "The Boxer",
    author: "JH",
    rating: "9.2",
    chapters: "Ch. 120",
    genre: "Sports, Psychological",
    status: "Completed",
    cover: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=80",
    isHovered: false
  },
  {
    id: "m5",
    title: "Bastard",
    author: "Carnby Kim, Youngchan Hwang",
    rating: "9.1",
    chapters: "Ch. 94",
    genre: "Thriller, Horror",
    status: "Completed",
    cover: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80",
    isHovered: false
  },
  {
    id: "m6",
    title: "Wind Breaker",
    author: "Yongseok Jo",
    rating: "9.0",
    chapters: "Ch. 482",
    genre: "Sports, Drama",
    status: "Ongoing",
    cover: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500&auto=format&fit=crop&q=80",
    isHovered: false
  },
  {
    id: "m7",
    title: "Return of the Blossoming Blade",
    author: "Biga, LICO",
    rating: "9.2",
    chapters: "Ch. 128",
    genre: "Martial Arts, Reincarnation",
    status: "Ongoing",
    cover: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80",
    isHovered: false
  },
  {
    id: "m8",
    title: "The Greatest Estate Developer",
    author: "BK_Moon, Kim Hyunsoo",
    rating: "9.3",
    chapters: "Ch. 142",
    genre: "Comedy, Fantasy",
    status: "Ongoing",
    cover: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop&q=80",
    isHovered: false
  },
  {
    id: "m9",
    title: "Legend of the Northern Blade",
    author: "Woogack, Hae-Min",
    rating: "9.4",
    chapters: "Ch. 180",
    genre: "Murim, Revenge",
    status: "Ongoing",
    cover: "https://images.unsplash.com/photo-1514539079130-25950c84af65?w=500&auto=format&fit=crop&q=80",
    isHovered: false
  },
  {
    id: "m10",
    title: "Eleceed",
    author: "Jehae, Zhena",
    rating: "9.1",
    chapters: "Ch. 290",
    genre: "Supernatural, Action",
    status: "Ongoing",
    cover: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop&q=80",
    isHovered: false
  },
  {
    id: "m11",
    title: "Nano Machine",
    author: "Jeolmu Hyeon, Hanjung Wolya",
    rating: "8.8",
    chapters: "Ch. 200",
    genre: "Sci-Fi, Murim",
    status: "Ongoing",
    cover: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=80",
    isHovered: false
  },
  {
    id: "m12",
    title: "SSS-Class Revival Hunter",
    author: "Shin Noah, Bill K",
    rating: "9.2",
    chapters: "Ch. 110",
    genre: "Fantasy, Regression",
    status: "Ongoing",
    cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
    isHovered: false
  }
];

export const COMMAND_PALETTE_DATA = {
  typedQuery: "inter",
  results: {
    movies: [
      {
        id: "interstellar",
        titlePrefix: "Inter",
        titleSuffix: "stellar",
        meta: "2014 · Christopher Nolan",
        score: "8.7",
        poster: "https://image.tmdb.org/t/p/w154/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
        isSelected: true,
        route: "/movie/interstellar"
      },
      {
        id: "interiors",
        titlePrefix: "Inter",
        titleSuffix: "iors",
        meta: "1978 · Woody Allen",
        score: "7.4",
        poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=120&auto=format&fit=crop&q=80",
        isSelected: false,
        route: "/search?q=interiors"
      }
    ],
    series: [
      {
        id: "interview-vampire",
        titlePrefix: "Inter",
        titleSuffix: "view with the Vampire",
        meta: "2022– · Drama, Fantasy",
        score: "7.3",
        poster: "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=120&auto=format&fit=crop&q=80",
        isSelected: false,
        route: "/search?q=interview"
      }
    ],
    books: [
      {
        id: "interlude",
        title: "Interlude",
        meta: "Novel · 2019",
        score: "8.2",
        poster: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=120&auto=format&fit=crop&q=80",
        isSelected: false,
        route: "/search?q=interlude"
      }
    ],
    people: [
      {
        id: "p1",
        name: "Christopher Nolan",
        role: "Director",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80"
      },
      {
        id: "p2",
        name: "Matthew McConaughey",
        role: "Actor",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80"
      },
      {
        id: "p3",
        name: "Jessica Chastain",
        role: "Actor",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80"
      }
    ]
  },
  recent: [
    { text: "Oppenheimer", type: "Film · 2023" },
    { text: "Severance", type: "Series · 2022" },
    { text: "Chungking Express", type: "Film · 1994" }
  ],
  trending: [
    { text: "Dune: Part Two", type: "Film · 8.5 TMDB" },
    { text: "Shōgun", type: "Series · 8.7 TMDB" },
    { text: "The Bear", type: "Series · 8.6 TMDB" }
  ]
};
