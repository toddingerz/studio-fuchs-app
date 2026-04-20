// Thin localStorage helpers. Keys are namespaced by clientId so
// multiple clients can be stored side-by-side without conflict.

const contentKey = (clientId) => `linkedin_content_${clientId}`;
const imagesKey = (clientId) => `linkedin_images_${clientId}`;

export function loadContent(clientId, defaults) {
  try {
    const raw = localStorage.getItem(contentKey(clientId));
    if (!raw) return { ...defaults };
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return { ...defaults };
  }
}

export function saveContent(clientId, content) {
  try {
    localStorage.setItem(contentKey(clientId), JSON.stringify(content));
  } catch {
    // quota exceeded — fail silently
  }
}

export function loadImages(clientId) {
  try {
    const raw = localStorage.getItem(imagesKey(clientId));
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveImages(clientId, images) {
  try {
    localStorage.setItem(imagesKey(clientId), JSON.stringify(images));
  } catch {
    // data URLs can be large; fail silently if quota exceeded
  }
}

export function resetContent(clientId) {
  try {
    localStorage.removeItem(contentKey(clientId));
    localStorage.removeItem(imagesKey(clientId));
  } catch {
    // ignore
  }
}
