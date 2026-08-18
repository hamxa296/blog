export async function checkIsBookmarked(userId: string, postId: string) {
  try {
    const bookmarkRef = doc(db, 'bookmarks', `${userId}_${postId}`);
    const snap = await getDoc(bookmarkRef);
    return snap.exists();
  } catch (error) {
    console.error("Error checking bookmark:", error);
    return false;
  }
}

export async function toggleBookmark(userId: string, postId: string) {
  try {
    const bookmarkRef = doc(db, 'bookmarks', `${userId}_${postId}`);
    const snap = await getDoc(bookmarkRef);
    if (snap.exists()) {
      await deleteDoc(bookmarkRef);
      return { success: true, isBookmarked: false };
    } else {
      await setDoc(bookmarkRef, {
        userId,
        postId,
        createdAt: serverTimestamp()
      });
      return { success: true, isBookmarked: true };
    }
  } catch (error: any) {
    console.error("Error toggling bookmark:", error);
    return { success: false, error: error.message };
  }
}
