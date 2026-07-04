import slugify from "slugify";

const slugOptions = {
    lower: true,
    strict: true,
    locale: "vi",
};

// Trả về full route path, ví dụ: /movies/12-avengers-endgame
export const generateMovieSlug = (name: string, id: string | number) => {
    return `/movies/${id}-${slugify(name || "noname", slugOptions)}`;
};

// Lấy lại id từ slug, ví dụ: "12-avengers-endgame" -> "12"
export const extractMovieId = (slug: string): string => {
    return slug.split("-")[0] ?? "";
};