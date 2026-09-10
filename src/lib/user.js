const USER_ID_KEY = "wire_user_id";
const PROFILE_KEY = "wire_user_profile";

export function getOrCreateUserId() {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export function getStoredProfile() {
  const raw = localStorage.getItem(PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function storeProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
