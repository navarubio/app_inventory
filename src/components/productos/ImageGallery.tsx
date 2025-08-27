import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { Loader2, Upload, Trash2, GripHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { CONFIG, buildImageUrl, buildApiUrl } from '@/config/urls'

interface ImageItem {
  key: string
  preview: string
  finalUrl?: string
  status: 'uploading' | 'completed'
  orden: number
}

interface ImageGalleryProps {
  productId?: number
  images: Array<{
    id: number
    rutaImagen: string
    orden: number
  }>
  onImagesUpdate?: (images: any[]) => void
}

function ImageGallery({ productId, images, onImagesUpdate }: ImageGalleryProps) {
  const [localImages, setLocalImages] = useState<ImageItem[]>(
    images
      .filter(img => img && img.id) // Filtrar imágenes válidas
      .map(img => ({
        key: img.id.toString(),
        preview: img.rutaImagen,
        finalUrl: img.rutaImagen,
        status: 'completed' as const,
        orden: img.orden || 0
      }))
  )

  // Solo sincronizamos cuando cambia el producto y las imágenes son diferentes
  useEffect(() => {
    console.log('🔄 useEffect - productId:', productId, 'images count:', images.length)
    console.log('🔍 Images recibidas:', images)
    
    const newImages = images
      .filter(img => img && img.id) // Filtrar imágenes válidas
      .map(img => ({
        key: img.id.toString(),
        preview: img.rutaImagen,
        finalUrl: img.rutaImagen,
        status: 'completed' as const,
        orden: img.orden || 0
      }))
    
    // Verificamos si hay diferencias antes de actualizar
    const currentKeys = localImages.map(img => img.key).sort()
    const newKeys = newImages.map(img => img.key).sort()
    
    if (JSON.stringify(currentKeys) !== JSON.stringify(newKeys)) {
      console.log('📝 Actualizando localImages - diferencias detectadas')
      setLocalImages(newImages)
    } else {
      console.log('✅ No hay cambios en las imágenes - manteniendo estado actual')
    }
  }, [productId])

  const uploadImage = async (file: File) => {
    console.log('🔄 Iniciando carga de imagen:', file.name)
    
    const tempKey = `${Date.now()}_${file.name}`
    const objectUrl = window.URL.createObjectURL(file)
    
    const tempImage = {
      key: tempKey,
      preview: objectUrl,
      status: 'uploading' as const,
      orden: localImages.length + 1
    }
    
    console.log('📝 Añadiendo imagen temporal al estado:', tempImage.key)
    setLocalImages(prev => [...prev, tempImage])

    try {
      const formData = new FormData()
      formData.append('file', file)  // Cambiado de 'image' a 'file'
      formData.append('codigoInterno', productId?.toString() || '')  // Cambiado de 'productId' a 'codigoInterno'

      console.log('🌐 Enviando a:', buildApiUrl('/api/images/upload'))
      console.log('📦 codigoInterno:', productId?.toString())
      console.log('📦 File name:', file.name, 'size:', file.size)

      // Endpoint correcto según el curl
      const response = await fetch(buildApiUrl('/api/images/upload'), {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Error del servidor:', response.status, errorText)
        throw new Error(`Error del servidor: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ Imagen subida exitosamente:', data)
      
      // Construir la URL de la imagen usando la configuración centralizada
      const fullImageUrl = data.url.startsWith('http') 
        ? data.url 
        : buildImageUrl(data.url) // Usar la función centralizada
      
      console.log('🖼️ URL de imagen (configurada):', fullImageUrl)
      
      // Solo mostramos el toast de éxito después de confirmar que se subió
      toast.success('Imagen subida correctamente')
      
      // Actualizamos el estado local usando callback para obtener el estado actual
      setLocalImages(prevImages => {
        console.log('🔍 prevImages antes de actualizar:', prevImages)
        console.log('🔍 Buscando tempKey:', tempKey)
        
        const updatedImages = prevImages.map(img => 
          img.key === tempKey 
            ? { ...img, status: 'completed' as const, finalUrl: fullImageUrl }
            : img
        )
        
        console.log('🔍 updatedImages después de map:', updatedImages)
        
        // Limpiamos la URL del preview
        const imageToClean = prevImages.find(img => img.key === tempKey)
        if (imageToClean?.preview && imageToClean.preview.startsWith('blob:')) {
          window.URL.revokeObjectURL(imageToClean.preview)
        }
        
        // Notificamos al padre con el estado actualizado
        if (onImagesUpdate) {
          setTimeout(() => {
            // Convertimos al formato que espera ProductoDetalle.tsx
            const formattedImages = updatedImages.map(img => {
              // Para imágenes nuevas (key con timestamp), generar un ID único
              const imageId = img.key.includes('_') ? 
                Math.floor(Math.random() * 1000000) + 900000 : // ID temporal para nuevas imágenes
                parseInt(img.key) || Date.now()
                
              return {
                id: imageId,
                codigoInternoProducto: productId?.toString() || '',
                rutaImagen: img.finalUrl || img.preview,
                orden: img.orden,
                altText: null
              }
            })
            console.log('📤 Enviando al padre:', formattedImages)
            onImagesUpdate(formattedImages)
          }, 0)
        }
        
        return updatedImages
      })

    } catch (error) {
      console.error('❌ Error al subir imagen:', error)
      
      // Removemos la imagen fallida del estado
      setLocalImages(prev => prev.filter(img => img.key !== tempKey))
      window.URL.revokeObjectURL(objectUrl)
      
      toast.error('Error al subir la imagen')
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      uploadImage(file)
    })
  }, [productId])

  const deleteImage = async (imageKey: string) => {
    const image = localImages.find(img => img.key === imageKey)
    if (!image) return

    try {
      if (image.finalUrl && !image.finalUrl.startsWith('blob:')) {
        await fetch(buildApiUrl('/api/images/delete'), {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: image.finalUrl })
        })
      }

      setLocalImages(prev => prev.filter(img => img.key !== imageKey))
      
      if (image.preview && image.preview.startsWith('blob:')) {
        window.URL.revokeObjectURL(image.preview)
      }
      
      const updatedImages = localImages.filter(img => img.key !== imageKey)
      
      // Convertir al formato correcto antes de enviar al padre
      const formattedImages = updatedImages.map(img => {
        const imageId = img.key.includes('_') ? 
          Math.floor(Math.random() * 1000000) + 900000 : 
          parseInt(img.key) || Date.now()
          
        return {
          id: imageId,
          codigoInternoProducto: productId?.toString() || '',
          rutaImagen: img.finalUrl || img.preview,
          orden: img.orden,
          altText: null
        }
      })
      
      onImagesUpdate?.(formattedImages)
      
      toast.success('Imagen eliminada')
    } catch (error) {
      console.error('Error al eliminar imagen:', error)
      toast.error('Error al eliminar la imagen')
    }
  }

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(localImages)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    const reorderedItems = items.map((item, index) => ({
      ...item,
      orden: index + 1
    }))

    setLocalImages(reorderedItems)
    
    // Convertir al formato correcto antes de enviar al padre
    const formattedImages = reorderedItems.map(img => {
      const imageId = img.key.includes('_') ? 
        Math.floor(Math.random() * 1000000) + 900000 : 
        parseInt(img.key) || Date.now()
        
      return {
        id: imageId,
        codigoInternoProducto: productId?.toString() || '',
        rutaImagen: img.finalUrl || img.preview,
        orden: img.orden,
        altText: null
      }
    })
    
    onImagesUpdate?.(formattedImages)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true
  })

  return (
    <div className="space-y-4">
      {/* Upload Zone - Diseño compacto original */}
      <div className="mb-4">
        <div
          {...getRootProps()}
          className={`inline-flex items-center gap-2 px-3 py-2 border-2 border-dashed cursor-pointer transition-colors rounded-md text-sm ${
            isDragActive
              ? 'border-blue-400 bg-blue-50 text-blue-600'
              : 'border-gray-300 hover:border-gray-400 text-gray-600'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-4 w-4" />
          <span>{isDragActive ? 'Suelta aquí' : 'Subir imágenes'}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1 ml-1">Formatos: JPG, PNG, WebP</p>
      </div>

      {/* Image Gallery */}
      {localImages.length > 0 && (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="image-gallery" direction="horizontal">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                {localImages.map((image, index) => (
                  <Draggable key={image.key} draggableId={image.key} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="relative group"
                      >
                        <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                          {image.status === 'uploading' ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            </div>
                          ) : (
                            <img
                              src={image.finalUrl || image.preview}
                              alt="Producto"
                              className="w-full h-full object-cover"
                              onLoad={() => console.log('✅ Imagen cargada correctamente:', image.finalUrl || image.preview)}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                console.log('❌ Error cargando imagen:', target.src)
                                
                                // Si falla la URL, intentar con la función centralizada
                                if (!target.src.includes('placeholder.svg')) {
                                  // Extraer la ruta relativa de la imagen desde la URL completa
                                  const urlObj = new URL(target.src)
                                  const imagePath = urlObj.pathname
                                  const directUrl = buildImageUrl(imagePath)
                                  console.log('🔄 Intentando URL reconstruida:', directUrl)
                                  target.src = directUrl
                                } else {
                                  console.log('🔄 Usando placeholder')
                                  target.src = '/placeholder.svg'
                                }
                              }}
                            />
                          )}
                          
                          {/* Drag Handle */}
                          <div
                            {...provided.dragHandleProps}
                            className="absolute top-2 left-2 bg-white/80 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                          >
                            <GripHorizontal className="h-4 w-4" />
                          </div>

                          {/* Delete Button */}
                          <button
                            onClick={() => deleteImage(image.key)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
      )}
    </div>
  )
}

export default ImageGallery
