export async function savePrivateDownload(url: string, fileName: string) {
  // Use the browser's native download pipeline so the transfer appears in its
  // downloads panel. The Worker supplies Content-Disposition and Content-Length.
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  return "browser" as const;
}
