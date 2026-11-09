export const BASE_PATH = import.meta.env.BASE_URL.replace(/\/+$/, "");

export function normalize(path: string) {
  const clean = path.split("?")[0].replace(/\/+$/, "");
  return clean === "" ? "/" : clean;
}

export function urlFor(path: string) {
  return `${BASE_PATH}${normalize(path)}`;
}

export function pathFromLocation() {
  const pathname = window.location.pathname;
  const relative = BASE_PATH && pathname.startsWith(BASE_PATH) ? pathname.slice(BASE_PATH.length) : pathname;
  return normalize(relative);
}