/**
 * Makes a picture of a colored page (the drawing on paper with the Pal's name) or of a free drawing (a canvas)
 * and offers it to share or save, for a parent to keep or send to grandma.
 */
export async function savePicture(source, name) {
  const size = 1200;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size * 1.25;
  const c = canvas.getContext('2d');
  c.fillStyle = '#fffcf4';
  c.fillRect(0, 0, canvas.width, canvas.height);
  if (source instanceof HTMLCanvasElement) {
    c.drawImage(source, 0, 0, canvas.width, canvas.height);
  } else {
    const copy = source.cloneNode(true);
    copy.setAttribute('width', size);
    copy.setAttribute('height', size);
    for (const el of copy.querySelectorAll('[tabindex]')) el.removeAttribute('tabindex');
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copy))}`;
    await image.decode();
    c.drawImage(image, 0, size * 0.15, size, size);
  }
  await document.fonts?.load('80px "Patrick Hand"').catch(() => {});
  c.fillStyle = '#4a3426';
  c.textAlign = 'center';
  c.font = '96px "Patrick Hand", cursive';
  if (name) c.fillText(name, size / 2, size * 0.13);
  c.font = '40px "Patrick Hand", cursive';
  c.globalAlpha = 0.55;
  c.fillText('My Pals Coloring Book · lumipals.app/coloring', size / 2, size * 1.21);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  const file = new File([blob], `${name || 'My drawing'}.png`, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name || 'My drawing' });
      return;
    } catch (error) {
      if (error?.name === 'AbortError') return;
    }
  }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 2000);
}
