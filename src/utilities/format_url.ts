export const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};

export const formatURL = (url: string): string | undefined => {
  if (isValidUrl(url)) {
    const [protocol, another] = url.split('://');
    return [protocol, another.split(/\/{2,}/gm).join('/')].join('://');
  }
  return undefined;
};
