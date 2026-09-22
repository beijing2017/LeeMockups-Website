type WritableDownloadFile = {
  createWritable: () => Promise<{
    write: (chunk: Uint8Array) => Promise<void>;
    close: () => Promise<void>;
    abort: () => Promise<void>;
  }>;
};

type SavePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types: Array<{ description: string; accept: Record<string, string[]> }>;
  }) => Promise<WritableDownloadFile>;
};

export type DownloadProgress = { received: number; total: number };

export async function savePrivateDownload(
  url: string,
  fileName: string,
  onProgress: (progress: DownloadProgress) => void,
) {
  const picker = (window as SavePickerWindow).showSaveFilePicker;
  if (!picker) {
    window.location.assign(url);
    return "browser" as const;
  }

  // The picker must be opened directly from the click gesture, before any network request.
  const handle = await picker({
    suggestedName: fileName,
    types: [{ description: "LeeMockups mockup", accept: { "application/octet-stream": [".mockup"] } }],
  });
  const writable = await handle.createWritable();
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok || !response.body) throw new Error("The download could not be started.");
    const total = Number(response.headers.get("content-length") || 0);
    const reader = response.body.getReader();
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      await writable.write(value);
      received += value.byteLength;
      onProgress({ received, total });
    }
    await writable.close();
    return "saved" as const;
  } catch (error) {
    await writable.abort().catch(() => undefined);
    throw error;
  }
}

export function downloadProgressLabel(progress: DownloadProgress | null) {
  if (!progress) return "Choose save location…";
  if (!progress.total) return "Downloading…";
  return `Downloading ${Math.min(100, Math.round((progress.received / progress.total) * 100))}%`;
}
