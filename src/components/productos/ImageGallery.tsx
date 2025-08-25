import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { Loader2, Upload, Trash2, GripHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { SERVER_URL } from '@/config'

interface ImageState {
  key: string
  preview: string
  finalUrl?: string
  status: 'uploading' | 'completed' | 'error'
  orden: number
  error?: string
}

interface ProductImage {
  id: number
  codigoInternoProducto: string
  rutaImagen: string
  orden: number
  altText: string | null
}

interface ImageGalleryProps {
  images: ProductImage[]
  productId: string
  onChange: (images: ProductImage[]) => void
  className?: string
}

export function ImageGallery({ images, productId, onChange, className }: ImageGalleryProps) {
  // Inicializamos el estado una sola vez cuando cambian las props
  const [localImages, setLocalImages] = useState<ImageState[]>(() => 
    images.map(img => ({
      key: img.id.toString(),
      preview: img.rutaImagen,
      finalUrl: img.rutaImagen,
      status: 'completed' as const,
      orden: img.orden
    }))
  )

  // Solo sincronizamos cuando cambia el producto
  useEffect(() => {
    setLocalImages(
      images.map(img => ({
        key: img.id.toString(),
        preview: img.rutaImagen,
        finalUrl: img.rutaImagen,
        status: 'completed' as const,
        orden: img.orden
      }))
    )
  }, [productId]) // Solo dependemos del productId, no de images

  // Notificamos cambios al padre de forma debounced
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const completedImages = localImages
        .filter(img => img.status === 'completed' && img.finalUrl)
        .map(img => ({
          id: isNaN(parseInt(img.key)) ? 0 : parseInt(img.key),
          codigoInternoProducto: productId,
          rutaImagen: img.finalUrl!,
          orden: img.orden,
          altText: null
        }))
      onChange(completedImages)
    }, 300) // Esperamos 300ms antes de notificar cambios

    return () => clearTimeout(timeoutId)
  }, [localImages, productId, onChange])

  const uploadImage = useCallback(async (file: File, tempKey: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('codigoInterno', productId)

    try {
      const response = await fetch(`${SERVER_URL}/api/images/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Error al subir la imagen')

      const data = await response.json()
      
      setLocalImages(prev => prev.map(img => 
        img.key === tempKey 
          ? { ...img, status: 'completed', finalUrl: data.url }
          : img
      ))

      // Limpiamos la URL del preview después de actualizar el estado
      window.URL.revokeObjectURL(
        localImages.find(img => img.key === tempKey)?.preview || ''
      )
      
      toast.success('Imagen subida exitosamente')
    } catch (error) {
      setLocalImages(prev => prev.map(img => 
        img.key === tempKey 
          ? { ...img, status: 'error', error: 'Error al subir la imagen' }
          : img
      ))
      toast.error('Error al subir la imagen')
    }
  }, [productId])

  const handleDelete = useCallback((key: string) => {
    setLocalImages(prev => 
      prev
        .filter(img => img.key !== key)
        .map((img, index) => ({ ...img, orden: index + 1 }))
    )
  }, []) // Sin dependencias

  const onDragEnd = useCallback((result: any) => {
    if (!result.destination) return

    setLocalImages(prev => {
      const items = Array.from(prev)
      const [reorderedItem] = items.splice(result.source.index, 1)
      items.splice(result.destination.index, 0, reorderedItem)
      return items.map((item, index) => ({ ...item, orden: index + 1 }))
    })
  }, []) // Sin dependencias

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setLocalImages(prev => {
      const newImages = acceptedFiles.map((file, index) => {
        const tempKey = Date.now().toString() + index
        const preview = URL.createObjectURL(file)

        // Iniciar la carga inmediatamente
        uploadImage(file, tempKey)

        return {
          key: tempKey,
          preview,
          status: 'uploading' as const,
          orden: prev.length + index + 1
        }
      })

      return [...prev, ...newImages]
    })
  }, [uploadImage])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/webp': ['.webp'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg']
    },
    multiple: true
  })

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-4">
        {/* Botón de carga separado */}
        <div
          {...getRootProps()}
          className={`
            w-[200px] aspect-square rounded-lg border-2 border-dashed
            flex items-center justify-center cursor-pointer
            hover:border-primary hover:bg-primary/5
            transition-colors
            ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="w-8 h-8" />
            <span className="text-xs text-center">
              Arrastra o selecciona imágenes
              <br />
              (WEBP, PNG, JPG)
            </span>
          </div>
        </div>

        {/* Área de imágenes arrastrables */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="image-gallery" direction="horizontal">
            {(provided) => (
              <div 
                ref={provided.innerRef} 
                {...provided.droppableProps} 
                className="flex flex-wrap gap-4"
              >
                {localImages.map((image, index) => (
                  <Draggable 
                    key={image.key} 
                    draggableId={image.key} 
                    index={index}
                    isDragDisabled={image.status === 'uploading'}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="w-[200px] relative aspect-square rounded-lg overflow-hidden group"
                      >
                        <img
                          src={image.finalUrl || image.preview}
                          alt="Product"
                          className="w-full h-full object-cover"
                        />
                        
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {image.status === 'uploading' && (
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                          )}
                          
                          {image.status === 'error' && (
                            <div className="flex flex-col items-center gap-2">
                              <Trash2 className="w-8 h-8 text-red-500" />
                              <button
                                onClick={() => handleDelete(image.key)}
                                className="text-xs text-white hover:underline"
                              >
                                Eliminar
                              </button>
                            </div>
                          )}

                          {image.status === 'completed' && (
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => handleDelete(image.key)}
                                className="text-white hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-6 h-6" />
                              </button>
                              <div {...provided.dragHandleProps}>
                                <GripHorizontal className="w-6 h-6 text-white cursor-grab" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  )
}
