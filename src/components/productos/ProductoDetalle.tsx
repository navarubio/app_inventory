import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { CategoriaSelector } from "./CategoriaSelector"
import { ErrorBoundary } from "@/components/ErrorBoundary"

interface ProductImage {
  id: number
  codigoInternoProducto: string
  rutaImagen: string
  orden: number
  altText: string | null
}

interface ProductoDetalleProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  producto: {
    codigoInterno: string
    upc: string
    nombreProducto: string
    presentacionOriginal: number
    laboratorio: string
    categoriaOriginal: string
    categoryId: number | null
    subcategoryId: number | null
    specific1Id: number | null
    specific2Id: number | null
    formaFarmaceutica: string | null
    concentracionDosis: string | null
    contenidoEnvase: string | null
    viaAdministracion: string | null
    poblacionDiana: string | null
    tagsIndicaciones: string | null
    paisFabricacion: string
    requierePrescripcionMedica: boolean
    esPsicotropico: boolean
    requiereCadenaDeFrio: boolean
    principioActivo: string
    patologia: string
    posologia: string
    contraindicaciones: string
    sustitutoSugerido: string
    nivelCompletacion: number
  }
}

export function ProductoDetalle({ open, onOpenChange, producto }: ProductoDetalleProps) {
  const [images, setImages] = useState<ProductImage[]>([])
  
  // Estado para manejar la categorización del producto
  const [categorization, setCategorization] = useState({
    categoryId: producto.categoryId || null,
    subcategoryId: producto.subcategoryId || null,
    specific1Id: producto.specific1Id || null,
    specific2Id: producto.specific2Id || null,
  })

  // Actualizar categorización cuando cambie el producto
  useEffect(() => {
    setCategorization({
      categoryId: producto.categoryId || null,
      subcategoryId: producto.subcategoryId || null,
      specific1Id: producto.specific1Id || null,
      specific2Id: producto.specific2Id || null,
    })
  }, [producto.categoryId, producto.subcategoryId, producto.specific1Id, producto.specific2Id])

  // Función para manejar cambios en la categorización
  const handleCategorizationChange = (field: string, value: number | null) => {
    console.log(`Actualizando estado: ${field} = ${value}`)
    
    setCategorization(prevState => ({
      ...prevState,
      [field]: value,
    }))
  }
  // URL base del servidor
  const SERVER_URL = 'http://10.10.10.251';

  // Cargar imágenes cuando el componente se monte o el código interno cambie
  useEffect(() => {
    const loadImages = async () => {
      try {
        console.log('Cargando imágenes para producto:', producto.codigoInterno);
        const response = await fetch(`${SERVER_URL}:8890/api/product-images/product/${producto.codigoInterno}`);
        if (!response.ok) {
          throw new Error('Error al cargar las imágenes');
        }
        const data = await response.json();
        console.log('Imágenes recibidas:', data);

        if (!Array.isArray(data) || data.length === 0) {
          console.log('No se encontraron imágenes');
          setImages([]);
          return;
        }

        // Las imágenes ya vienen con la ruta relativa correcta (/media/products/...)
        const transformedImages = data.map((img: ProductImage) => {
          // Construir la URL completa agregando solo el servidor base
          const imageUrl = `${SERVER_URL}${img.rutaImagen}`;
          console.log('URL completa de la imagen:', imageUrl);
          
          return {
            ...img,
            rutaImagen: imageUrl
          };
        });

        console.log('Imágenes transformadas:', transformedImages);
        setImages(transformedImages);
      } catch (error) {
        console.error('Error cargando imágenes:', error);
        setImages([]);
      }
    };
    
    if (producto.codigoInterno) {
      loadImages();
    }
  }, [producto.codigoInterno]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px] w-full max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {producto.nombreProducto}
            <Badge variant="outline">{producto.codigoInterno}</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Progress value={producto.nivelCompletacion} className="w-[60%]" />
            <span className="text-sm text-muted-foreground">
              Nivel de completación: {producto.nivelCompletacion}%
            </span>
          </div>

          <Tabs defaultValue="identificacion" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-red-600">
              <TabsTrigger 
                value="identificacion"
                className="data-[state=active]:bg-white data-[state=active]:text-red-600 text-white"
              >
                Identificación
              </TabsTrigger>
              <TabsTrigger 
                value="filtros"
                className="data-[state=active]:bg-white data-[state=active]:text-red-600 text-white"
              >
                Atributos de Filtro
              </TabsTrigger>
              <TabsTrigger 
                value="regulatorio"
                className="data-[state=active]:bg-white data-[state=active]:text-red-600 text-white"
              >
                Regulatorio
              </TabsTrigger>
              <TabsTrigger 
                value="vademecum"
                className="data-[state=active]:bg-white data-[state=active]:text-red-600 text-white"
              >
                Vademécum
              </TabsTrigger>
              <TabsTrigger 
                value="imagenes"
                className="data-[state=active]:bg-white data-[state=active]:text-red-600 text-white"
              >
                Imágenes
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[60vh] w-full rounded-md border p-4 bg-[#f5f5dc] shadow-inner">
              <TabsContent value="identificacion">
                <Card>
                  <CardHeader>
                    <CardTitle>Información Básica</CardTitle>
                    <CardDescription>Datos principales de identificación del producto</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="upc">UPC</Label>
                      <Input id="upc" value={producto.upc} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nombreProducto">Nombre del Producto</Label>
                      <Input id="nombreProducto" value={producto.nombreProducto} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="presentacion">Presentación Original</Label>
                      <Input 
                        id="presentacion" 
                        type="number" 
                        value={producto.presentacionOriginal} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="laboratorio">Laboratorio</Label>
                      <Input id="laboratorio" value={producto.laboratorio} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoriaOriginal">Categoría Original</Label>
                      <Input id="categoriaOriginal" value={producto.categoriaOriginal} readOnly />
                    </div>

                    {/* Selector de Nueva Categorización */}
                    <div className="col-span-2">
                      <Label>Nueva Categorización</Label>
                      <ErrorBoundary
                        fallback={
                          <div className="p-4 border border-destructive rounded-lg bg-destructive/10">
                            <p className="text-sm text-destructive">
                              Hubo un error al cargar el selector de categorías. 
                              Por favor, intente refrescar la página o contacte al soporte técnico.
                            </p>
                          </div>
                        }
                      >
                      <div className="grid gap-4 p-4 border rounded-lg bg-background/50">
                        <CategoriaSelector
                          categoryId={categorization.categoryId}
                          subcategoryId={categorization.subcategoryId}
                          specific1Id={categorization.specific1Id}
                          specific2Id={categorization.specific2Id}
                          onChange={handleCategorizationChange}
                        />
                      </div>
                    </ErrorBoundary>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="filtros">
                <Card>
                  <CardHeader>
                    <CardTitle>Atributos de Filtro</CardTitle>
                    <CardDescription>Características específicas del producto</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="formaFarmaceutica">Forma Farmacéutica</Label>
                      <Input 
                        id="formaFarmaceutica" 
                        value={producto.formaFarmaceutica || ''} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="concentracionDosis">Concentración/Dosis</Label>
                      <Input 
                        id="concentracionDosis" 
                        value={producto.concentracionDosis || ''} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contenidoEnvase">Contenido del Envase</Label>
                      <Input 
                        id="contenidoEnvase" 
                        value={producto.contenidoEnvase || ''} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="viaAdministracion">Vía de Administración</Label>
                      <Input 
                        id="viaAdministracion" 
                        value={producto.viaAdministracion || ''} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="poblacionDiana">Población Diana</Label>
                      <Input 
                        id="poblacionDiana" 
                        value={producto.poblacionDiana || ''} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tagsIndicaciones">Tags e Indicaciones</Label>
                      <Textarea 
                        id="tagsIndicaciones" 
                        value={producto.tagsIndicaciones || ''} 
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="regulatorio">
                <Card>
                  <CardHeader>
                    <CardTitle>Información Regulatoria</CardTitle>
                    <CardDescription>Aspectos regulatorios y logísticos</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="paisFabricacion">País de Fabricación</Label>
                      <Input 
                        id="paisFabricacion" 
                        value={producto.paisFabricacion} 
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="prescripcion" 
                        checked={producto.requierePrescripcionMedica} 
                      />
                      <Label htmlFor="prescripcion">Requiere Prescripción Médica</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="psicotropico" 
                        checked={producto.esPsicotropico} 
                      />
                      <Label htmlFor="psicotropico">Es Psicotrópico</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="cadenaDeFrio" 
                        checked={producto.requiereCadenaDeFrio} 
                      />
                      <Label htmlFor="cadenaDeFrio">Requiere Cadena de Frío</Label>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="vademecum">
                <Card>
                  <CardHeader>
                    <CardTitle>Información Vademécum</CardTitle>
                    <CardDescription>Información farmacológica detallada</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="principioActivo">Principio Activo</Label>
                      <Textarea 
                        id="principioActivo" 
                        value={producto.principioActivo} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="posologia">Posología</Label>
                      <Textarea 
                        id="posologia" 
                        value={producto.posologia} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contraindicaciones">Contraindicaciones</Label>
                      <Textarea 
                        id="contraindicaciones" 
                        value={producto.contraindicaciones} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sustitutoSugerido">Sustituto Sugerido</Label>
                      <Textarea 
                        id="sustitutoSugerido" 
                        value={producto.sustitutoSugerido} 
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="imagenes">
                <Card>
                  <CardHeader>
                    <CardTitle>Galería de Imágenes</CardTitle>
                    <CardDescription>Imágenes asociadas al producto</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {images.length > 0 ? (
                        images.map((image) => {
                          console.log('Renderizando imagen:', image);
                          return (
                            <div 
                              key={image.id} 
                              className="relative aspect-square bg-white p-2 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                            >
                              <div className="absolute inset-0 flex items-center justify-center">
                                <img
                                  src={image.rutaImagen}
                                  alt={image.altText || `Imagen ${image.orden} del producto ${image.codigoInternoProducto}`}
                                  className="max-w-full max-h-full object-contain rounded-lg"
                                  onError={(e) => {
                                    console.error('Error cargando imagen:', image.rutaImagen);
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/placeholder.svg';
                                    target.classList.add('opacity-50');
                                    toast({
                                      variant: "destructive",
                                      title: "Error al cargar la imagen",
                                      description: `No se pudo cargar la imagen ${image.orden} del producto ${image.codigoInternoProducto}`
                                    });
                                  }}
                                  onLoad={() => console.log('Imagen cargada exitosamente:', image.rutaImagen)}
                                />
                              </div>
                              <Badge 
                                className="absolute top-2 right-2 bg-red-600 text-white" 
                                variant="secondary"
                              >
                                {image.orden}
                              </Badge>
                              {/* Para depuración */}
                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] p-1 break-all">
                                Ruta: {image.rutaImagen}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-3 p-8 text-center bg-white rounded-lg border-2 border-dashed border-gray-200">
                          <div className="flex flex-col items-center gap-2">
                            <img 
                              src="/placeholder.svg" 
                              alt="Sin imágenes" 
                              className="w-24 h-24 opacity-50"
                            />
                            <p className="text-gray-500 mt-2">
                              No hay imágenes disponibles para este producto
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
