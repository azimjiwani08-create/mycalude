export const FEED_ID = "companion-feed";

/** The feed scrolls sideways, one companion per screen. */
export function scrollFeedToTop(behavior: ScrollBehavior) {
  document.getElementById(FEED_ID)?.scrollTo({ left: 0, behavior });
}

/** Snap the feed to a companion by index (used by the previous/next buttons). */
export function scrollFeedTo(index: number, behavior: ScrollBehavior) {
  const ul = document.getElementById(FEED_ID);
  const li = ul?.querySelector<HTMLElement>(`[data-index="${index}"]`);
  if (!ul || !li) return;
  ul.scrollTo({ left: li.offsetLeft - parseFloat(getComputedStyle(ul).paddingLeft), behavior });
}
