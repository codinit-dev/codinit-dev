export function encodeUsageAnnotation(toolCallId: any, usage: any, _providerMetadata: any) {
  return usage;
}

export function encodeModelAnnotation(_toolCallId: any, _providerMetadata: any, _modelChoice: any) {
  return { model: modelChoice };
}
