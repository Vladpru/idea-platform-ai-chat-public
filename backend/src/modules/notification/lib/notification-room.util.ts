/** Socket.IO room name for a user's personal notification channel (root namespace). */
export const userRoom = (userId: string): string => `user:${userId}`;
