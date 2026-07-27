export function parseLabelList(output) {
  return output.trim() ? JSON.parse(output) : [];
}
