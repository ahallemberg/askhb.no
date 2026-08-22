export const R2_ENDPOINT = "https://r2.askhb.no"
export const R2_EDUCATION_ENDPOINT = R2_ENDPOINT + "/education.json"
export const R2_EXPERIENCES_ENDPOINT = R2_ENDPOINT + "/experiences.json"
export const R2_PERSONAL_INFO_ENDPOINT = R2_ENDPOINT + "/personalinfo.json"
// Where the header photo lives, and the fallback for PersonalInfo.profilePictureUrl.
// Both address the same object -- a replacement overwrites this key rather than
// adding one -- so this URL never stops working; it just cannot tell the edge
// cache that the bytes behind it changed.
export const R2_PROFILE_PICTURE = R2_ENDPOINT + "/profilepicture.png"
export const R2_PROJECTS_ENDPOINT = R2_ENDPOINT + "/projects.json"