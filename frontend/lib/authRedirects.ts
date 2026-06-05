export const DEFAULT_REDIRECT_PATH = "/dashboard";

export const getSafeRedirectPath = (value: string | null) => {
  if (!value) return DEFAULT_REDIRECT_PATH;
  if (!value.startsWith("/") || value.startsWith("//")) return DEFAULT_REDIRECT_PATH;
  if (value.startsWith("/login")) return DEFAULT_REDIRECT_PATH;
  return value;
};

export const getLoginPathForCallback = (callbackUrl: string | null) => {
  const path = getSafeRedirectPath(callbackUrl);
  const isCitizenRoute = path.startsWith("/report");
  return isCitizenRoute ? "/login/citizen" : "/login";
};
