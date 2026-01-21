export function encodeUsageAnnotation(toolCallId: any, usage: any, providerMetadata: any) {
  return usage;
}

export function encodeModelAnnotation(toolCallId: any, _providerMetadata: any, _modelChoice: any) {
  return { model: modelChoice };
}
