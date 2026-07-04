import type { Movie } from "../types/movie.types";

const BACKDROP =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAhk42BMa5huwN9V4NaJv7Z-YNvYOkq7QrE7XsyBvr_R3q0IoXQpLgqCa_PVWFpdPljx8EccX-O8tABkX2CKnOalE8wfITd3_kpM_-Z8zVJtYu1USwBHp5-0GamW-9AbM7MvfBhjaZYoVUvfO4nsAeInzBmElFwTEvSrh04bCO7NC1bIrH5VU1vlEm-Kf_uUreYmypZ3vxeL1LthNFEoUM5e2XpE9wvJf8wWnE9_2_eGOjDpObrvvp0PhJruhc5M_nKudIb6IFtpblI";

export const toyStory5: Movie = {
    id: "toy-story-5",
    title: "Toy Story 5",
    rating: "G",
    duration: 100,
    genres: ["Animation", "Adventure"],
    synopsis:
        "In the fifth installment of the legendary franchise, Woody, Buzz, and the rest of the gang face their most technologically advanced challenge yet. When a new line of hyper-intelligent smart-toys begins to replace the classics in the hearts of children worldwide, our heroes must embark on a journey across the digital and physical worlds to remind the world that a toy's true power comes from the heart, not the hardware. Experience a cinematic adventure that celebrates friendship, legacy, and the magic of childhood.",
    backdropImage: BACKDROP,
    posterImage: BACKDROP,
    cast: [
        {
            id: "1",
            name: "Tom Hanks",
            role: "Woody (Voice)",
            photo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBjaSMwbMfapSeDwe1nQnp6o05Rn-88R2HQEaCai1iYOSYrRqxgTM6gwuqfXEOoMd-T8tlCkNJKYGugfipfMN5RU72wRM8it0TFLyMkOSFARNZ6LUo5L_E5HLDCW7URVEi6L7WplmUi68QVcgM7NwjyXizuMRvoh7z7uoFDp7I71YwWZPmyDWWaWjRLCA7MOqkJS-AUw1OnYL1fYzeHsyfTbhp6iqw_frrjholZurbPwVfd1KSNAqKxaURXIWWebWMDDZvAn0usuJSe",
        },
        {
            id: "2",
            name: "Tim Allen",
            role: "Buzz (Voice)",
            photo: "https://lh3.googleusercontent.com/aida-public/AB6AXuB0sPuMemA7YEZzIEZp7JSCqUhQeSR7CNdoR6fbWNlQadfzxXjOk-njxiIq4YeYUh0R02BfAaZtZYcrMVsDNx5RX03whKOxuRj3_Bl2-XbUgpWVXMg4ZEooULfkggQN1mUErdlk1hfLO3MbAPtuwP73JarLQizwIg4IgEQIY0PPZb4Igt3qGk6BxR7pv9aPvqjofC3lFe5bZ5auaOQoOBVtFdAsSHNaSLciEQtiaRrt_BuH4hndpT5KQeIFbyUljzHkvwSZe3BQ1kRa",
        },
        {
            id: "3",
            name: "Joan Cusack",
            role: "Jessie (Voice)",
            photo: "https://lh3.googleusercontent.com/aida-public/AB6AXuCygaCCq_cHNKEVWDzEjJCZ_ArEA7CKaOvCoJgcIx10Qq1Oc36s5PmDjBoF2DP0kfduGlufAs4O4qqJny5MtY3G2hfYdsZChI3mhaC-jLESLpvVkG4k4xU-rifGbuxUjje_BdJcgboHOJB0NES1xt2gFtYOClqq-SmG-7CtQjl8M942Mr63ICF3xidpNo_Do4Uvlgjgx0mxwtiIt5PwrMuNRLv6uXdo18LntRFDjQIp6XCHvnDINWf_HR1TNyodLn-XgG37Fm8kbkM9",
        },
        {
            id: "4",
            name: "Andrew Stanton",
            role: "Director",
            photo: "https://lh3.googleusercontent.com/aida-public/AB6AXuChKBZmKbsYgBQxwh_2GbaNv6RMhijNUHn0ZWBL4DYCl8Cit1eLDrXIbe-WbL3p1dN4ujh6kJVYgUYLcETIw7RanyHq8Fi92TDzUTesczaEmcG28y_TBwC95L9p7WAmlY9HORNB8eS1as75O3RZ0t5J2-3pp53NjW2HBkEK_B4L1hT0NQ-Ip5-nh2eMv8_zmd-PPkTQoXKuSqbrv_FgajXdE2UelFy0vW5amSaO-AL-OJHWgfC_viIo12kpiuzCZnohfjYBBUdWlBMZ",
        },
    ],
    showtimes: {
        dates: [
            { month: "SEP", day: 14 },
            { month: "SEP", day: 15 },
            { month: "SEP", day: 16 },
        ],
        formats: [
            {
                label: "Standard 2D",
                format: "2d",
                times: [{ time: "10:30" }, { time: "13:15" }, { time: "16:00" }],
            },
            {
                label: "Digital 3D",
                format: "3d",
                times: [{ time: "11:00" }, { time: "14:45" }, { time: "19:30" }],
            },
            {
                label: "IMAX Experience",
                format: "imax",
                times: [{ time: "12:00" }, { time: "17:30" }, { time: "21:00" }],
            },
        ],
    },
};