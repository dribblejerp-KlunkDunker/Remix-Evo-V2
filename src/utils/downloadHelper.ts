/**
 * Helper to download files reliably inside an iframe/proxy environment
 * by fetching as a blob and triggering a local anchor download.
 */
export async function triggerDownload(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
  } catch (err) {
    console.warn('Blob download failed, falling back to direct link:', err);
    const fallbackLink = document.createElement('a');
    fallbackLink.href = url;
    fallbackLink.download = filename;
    document.body.appendChild(fallbackLink);
    fallbackLink.click();
    document.body.removeChild(fallbackLink);
  }
}
