export function encodeUsageAnnotation(toolCallId: any, usage: any, providerMetadata: any) {
  return usage;
}

export function encodeModelAnnotation(toolCallId: any, providerMetadata: any, modelChoice: any) {
  return { model: modelChoice };
}
