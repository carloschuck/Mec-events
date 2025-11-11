export function normalizeSourceUrl(url) {
  if (!url) {
    return '';
  }

  if (typeof url !== 'string') {
    return url;
  }

  // Trim whitespace and remove trailing slashes
  const trimmed = url.trim();
  return trimmed.replace(/\/+$/, '');
}

export function sanitizeMecApiBaseUrl(url) {
  if (!url) {
    return '';
  }

  const normalized = normalizeSourceUrl(url.replace('/wp-json/mec/v1.0', ''));
  return normalized;
}


