export const presetDuplicateResolvers: Record<
  string,
  (url1: URL, url2: URL) => boolean
> = {
  'https://www.youtube.com/watch': (url1, url2) => {
    return url1.searchParams.get('v') === url2.searchParams.get('v');
  },
  'https://www.google.com/search': (url1, url2) => {
    return url1.searchParams.get('q') === url2.searchParams.get('q');
  },
  'https://news.ycombinator.com/item': (url1, url2) => {
    return url1.searchParams.get('id') === url2.searchParams.get('id');
  },
};
