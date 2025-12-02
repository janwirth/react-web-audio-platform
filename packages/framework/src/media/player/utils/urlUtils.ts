/**
 * Normalize URLs for comparison by removing query parameters
 */
export const normalizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.origin + urlObj.pathname;
  } catch {
    // If URL parsing fails, try to remove query string manually
    return url.split("?")[0];
  }
};

