export function getApiBaseUrl() {
  if (typeof window !== "undefined" && window.location && window.location.hostname) {
    const host = window.location.hostname;
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    // If envUrl is a remote URL and not hardcoded localhost, use it
    if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
      return envUrl;
    }
    // Dynamically connect to the machine's IP (e.g., 10.141.191.205) on port 8000
    const protocol = window.location.protocol === "https:" ? "https:" : "http:";
    return `${protocol}//${host}:8000`;
  }
  return "http://localhost:8000";
}

export function getFileUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
