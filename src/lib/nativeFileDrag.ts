export function isNativeFileDrag(event: React.DragEvent): boolean {
  return event.dataTransfer.types.includes('Files')
}

export function filesFromDataTransfer(dataTransfer: DataTransfer): File[] {
  return Array.from(dataTransfer.files)
}
