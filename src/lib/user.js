export function profileFromFirebaseUser(user) {
  if (!user) return null;

  return {
    userId: user.uid,
    username: user.displayName || user.email?.split("@")[0] || "Google user",
    email: user.email || "",
    photoURL: user.photoURL || "",
  };
}
