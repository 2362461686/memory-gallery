// Re-export from store for backward compatibility
// Prisma has been replaced with JSON file-based storage
export { createUser, findUserByEmail, findUserById, createPost, findPostsByUser, updatePost, findPostsByIds, createExhibition, findExhibitionsByUser, findExhibitionById, findExhibitionByShareToken, createExhibitionPost, findExhibitionPosts } from "./store";
