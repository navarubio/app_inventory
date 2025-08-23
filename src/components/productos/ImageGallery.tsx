import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { SERVER_URL } from '@/config'

interface ImageState {
  id: string
  preview: string
  finalUrl?: string
  status: 'uploading' | 'completed' | 'error'
  file?: File
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
  const [uploadingImages, setUploadingImages] = useState<ImageState[]>([])

  // Combinar imágenes existentes con las que se están subiendo
  const allImages = [
    ...images.map(img => ({
      id: img.id.toString(),
      preview: img.rutaImagen,
      finalUrl: img.rutaImagen,
      status: 'completed' as const,
      orden: img.orden
    })),
    ...uploadingImages
  ].sort((a, b) => a.orden - b.orden)

  // Configuración de dropzone
  const { getRootProps, getInputProps, open } = useDropzone({
    accept: {
      'image/webp': ['.webp'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg']
    },
    noClick: true,
    noKeyboard: true,
    multiple: true,
    onDrop: handleFileDrop
  })

  // Función para subir una imagen individual
  async function uploadImage(imageState: ImageState) {
    try {
      if (!imageState.file) throw new Error('No file to upload')

      const formData = new FormData()
      formData.append('file', imageState.file)
      formData.append('productId', productId)
      formData.append('orden', imageState.orden.toString())

      const response = await fetch(`${SERVER_URL}/api/images/upload`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Error al subir imagen')
      
      const data = await response.json()

      // Actualizar el estado de la imagen
      setUploadingImages(prev => prev.map(img => 
        img.id === imageState.id ? {
          ...img,
          status: 'completed',
          finalUrl: data.url,
          file: undefined // Liberar memoria
        } : img
      ))

      // Actualizar el estado del padre con la imagen completada
      onChange([
        ...images,
        {
          id: parseInt(data.id),
          codigoInternoProducto: productId,
          rutaImagen: data.url,
          orden: imageState.orden,
          altText: null
        }
      ])

      // Liberar URL temporal
      URL.revokeObjectURL(imageState.preview)
    } catch (error) {
      console.error('Error uploading image:', error)
      setUploadingImages(prev => prev.map(img => 
        img.id === imageState.id ? {
          ...img,
          status: 'error',
          error: error instanceof Error ? error.message : 'Error desconocido'
        } : img
      ))
    }
  }

  // Manejador de carga de archivos
  function handleFileDrop(acceptedFiles: File[]) {
    const newImages: ImageState[] = acceptedFiles.map((file, index) => ({
      id: `temp_${Date.now()}_${index}`,
      preview: URL.createObjectURL(file),
      status: 'uploading',
      file,
      orden: allImages.length + index + 1
    }))

    // Agregar las nuevas imágenes al estado
    setUploadingImages(prev => [...prev, ...newImages])

    // Iniciar la carga de cada imagen
    newImages.forEach(uploadImage)
  }

  // Manejador de reordenamiento
  function handleDragEnd(result: any) {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    // Reordenar las imágenes completadas
    const completedImages = Array.from(images)
    const [reorderedItem] = completedImages.splice(sourceIndex, 1)
    completedImages.splice(destinationIndex, 0, reorderedItem)

    // Actualizar el orden de todas las imágenes
    const updatedImages = completedImages.map((item, index) => ({
      ...item,
      orden: index + 1
    }))

    // Actualizar el estado del padre con las imágenes completadas reordenadas
    onChange(updatedImages)

    // Actualizar el orden de las imágenes en proceso de carga
    setUploadingImages(prevUploading => {
      const withNewOrder = prevUploading.map(img => ({
        ...img,
        orden: updatedImages.length + prevUploading.indexOf(img) + 1
      }))
      return withNewOrder
    })
  }

  // Manejador de eliminación
  function handleDelete(imageId: number) {
    const updatedImages = images
      .filter(img => img.id !== imageId)
      .map((img, index) => ({
        ...img,
        orden: index + 1
      }))
    
    onChange(updatedImages)
  }

  return (
    <div {...getRootProps()} className={className}>
      <input {...getInputProps()} />
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="images" direction="horizontal">
          {(provided) => (
            <div 
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {/* Botón Agregar Imagen */}
              <Card className="aspect-square flex items-center justify-center cursor-pointer hover:bg-accent/10 border-dashed">
                <Button
                  variant="ghost"
                  className="w-full h-full flex flex-col items-center justify-center gap-2"
                  onClick={open}
                  disabled={uploadingImages.some(img => img.status === 'uploading')}
                >
                  {uploadingImages.some(img => img.status === 'uploading') ? (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span>Subiendo...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8" />
                      <span>Agregar Imagen</span>
                      <span className="text-xs text-muted-foreground">
                        PNG, JPG o WEBP
                      </span>
                    </>
                  )}
                </Button>
              </Card>

              {/* Lista de imágenes */}
              {images.map((image, index) => (
                <Draggable key={image.id} draggableId={image.id.toString()} index={index}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`
                        relative aspect-square overflow-hidden group
                        ${snapshot.isDragging ? 'ring-2 ring-primary ring-offset-2' : ''}
                      `}
                    >
                      <img
                        src={image.rutaImagen}
                        alt={image.altText || `Imagen ${index + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-2 left-2 text-white text-sm">
                          Orden: {index + 1}
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(image.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
