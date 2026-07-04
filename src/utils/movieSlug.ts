// export const generateMovieSlug = (
//     title: string,
//     id: number
// ) => {
//     return `${title
//         .toLowerCase()
//         .trim()
//         .replace(/[^a-z0-9]+/g, "-")
//         .replace(/^-|-$/g, "")}-${id}`;
// };
//
// export const extractMovieId = (
//     slug: string
// ): number | null => {
//     // [2026-06-27] Hỗ trợ slug dạng "ten-phim-123" hoặc chỉ "123"
//     const slugMatch = slug.match(/-(\d+)$/);
//     if (slugMatch) return Number(slugMatch[1]);
//
//     if (/^\d+$/.test(slug)) return Number(slug);
//
//     return null;
// };


// gan cai nay vao home
// <Card
//     onClick={() =>
// navigate(
//     `/movies/${generateMovieSlug(
//         movie.title,
//         movie.id
//     )}`
// )
// }
// />