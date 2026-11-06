/** Browser permission and completion are authoritative; callers present refusal. */
export async function writeClipboardText(value: string): Promise<void> {
  await navigator.clipboard.writeText(value);
}
