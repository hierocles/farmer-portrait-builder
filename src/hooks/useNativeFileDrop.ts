import { useRef, useState } from 'react'

import { filesFromDataTransfer, isNativeFileDrag } from '../lib/nativeFileDrag'

interface UseNativeFileDropOptions {
  onDrop: (files: File[]) => void
  disabled?: boolean
}

export function useNativeFileDrop({ onDrop, disabled = false }: UseNativeFileDropOptions) {
  const fileDragDepthRef = useRef(0)
  const [isFileDragOver, setIsFileDragOver] = useState(false)

  const handleFileDragEnter = (event: React.DragEvent) => {
    if (disabled || !isNativeFileDrag(event)) return

    fileDragDepthRef.current += 1
    setIsFileDragOver(true)
  }

  const handleFileDragOver = (event: React.DragEvent) => {
    if (disabled || !isNativeFileDrag(event)) return

    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  const handleFileDragLeave = (event: React.DragEvent) => {
    if (disabled || !isNativeFileDrag(event)) return

    fileDragDepthRef.current -= 1

    if (fileDragDepthRef.current <= 0) {
      fileDragDepthRef.current = 0
      setIsFileDragOver(false)
    }
  }

  const handleFileDrop = (event: React.DragEvent) => {
    if (disabled || !isNativeFileDrag(event)) return

    event.preventDefault()
    fileDragDepthRef.current = 0
    setIsFileDragOver(false)

    const files = filesFromDataTransfer(event.dataTransfer)
    if (files.length > 0) onDrop(files)
  }

  return {
    isFileDragOver,
    fileDropHandlers: {
      onDragEnter: handleFileDragEnter,
      onDragOver: handleFileDragOver,
      onDragLeave: handleFileDragLeave,
      onDrop: handleFileDrop,
    },
  }
}
