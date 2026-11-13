/**
 * Share text with the system share sheet when the browser has one, otherwise copy it.
 * @returns Promise<'shared' | 'copied' | 'cancelled' | 'failed'>
 */
export async function shareText(text) {
  const data = { text };
  if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
    try {
      await navigator.share(data);
      return 'shared';
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled';
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}
