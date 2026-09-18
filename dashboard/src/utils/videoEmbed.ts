export function getYoutubeEmbedUrl(src: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = src.match(pattern);
    if (match) {
      return `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1&mute=1&loop=1&playlist=${match[1]}&controls=0&playsinline=1`;
    }
  }
  return null;
}

export function getVimeoEmbedUrl(src: string): string | null {
  const match = src.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (match) {
    return `https://player.vimeo.com/video/${match[1]}?autoplay=1&muted=1&loop=1&background=1`;
  }
  return null;
}

export function getEmbedUrl(src: string): string | null {
  return getYoutubeEmbedUrl(src) || getVimeoEmbedUrl(src);
}

export function isVideoUrl(url: string): boolean {
  return (
    getYoutubeEmbedUrl(url) !== null ||
    getVimeoEmbedUrl(url) !== null ||
    /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)
  );
}

