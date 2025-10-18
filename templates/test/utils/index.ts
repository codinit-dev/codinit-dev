export function removeFileHash(filename: string) {
  return filename.replace(/-\w*/, '');
}
