export interface PreparedFile {
  save(): void;
  dispose(): void;
}
export interface DownloadHost {
  prepare(bytes: Uint8Array, name: string, contentType: string): PreparedFile;
}
export function createBrowserDownloads(): DownloadHost {
  return {
    prepare(bytes, name, contentType) {
      const blob = new Blob([new Uint8Array(bytes)], { type: contentType });
      const url = URL.createObjectURL(blob);
      return {
        save() {
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = name;
          document.body.append(anchor);
          try {
            anchor.click();
          } finally {
            anchor.remove();
          }
        },
        dispose() {
          URL.revokeObjectURL(url);
        },
      };
    },
  };
}
