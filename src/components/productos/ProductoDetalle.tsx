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
import { Button } from "@/components/ui/button"
import { CloneCategorization } from "./CloneCategorization"
import { SearchableSelect } from "./SearchableSelect"
import { TagSelect } from "./TagSelect"
import { SuggestionInput } from "./SuggestionInput"
import { parseConcentracion, parseEnvase } from "@/utils/productParsers"
import { ToggleRow } from "./ToggleRow"
import { CountrySelect } from "./CountrySelect"
import { AssistantButton } from "./AssistantButton"
import { PrincipioActivoSelect } from "./PrincipioActivoSelect"
import { ImageGallery } from "./ImageGallery"

interface ProductImage {
  id: number
  codigoInternoProducto: string
  rutaImagen: string
  orden: number
  altText: string | null
}

interface ProductFormState {
  // Identificación
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
  
  // Atributos de Filtro
  formaFarmaceuticaId: number | null
  formaFarmaceutica: string | null
  concentracionDosis: string | null
  contenidoEnvase: string | null
  viaAdministracionId: number | null
  viaAdministracion: string | null

  // Datos Regulatorios
  paisFabricacion: string
  requierePrescripcionMedica: boolean
  esPsicotropico: boolean
  requiereCadenaDeFrio: boolean
  poblacionDianaId: number | null
  poblacionDiana: string | null
  tags: Array<{ id: number | null, nombre: string }>
  
  // Vademécum
  principioActivo: string
  patologia: string
  posologia: string
  contraindicaciones: string
  sustitutoSugerido: string
}

interface ProductoDetalleProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  producto: ProductFormState & {
    nivelCompletacion: number
  }
}

export function ProductoDetalle({ open, onOpenChange, producto }: ProductoDetalleProps) {
  const [images, setImages] = useState<ProductImage[]>([])
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false)
  const [formState, setFormState] = useState<ProductFormState>({} as ProductFormState)
  const [isFormDirty, setIsFormDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isAssistantLoading, setIsAssistantLoading] = useState(false)

  // Efecto para inicializar el formulario solo cuando cambia el código interno del producto
  useEffect(() => {
    if (producto?.codigoInterno) {
      setFormState(prevState => {
        // Solo actualizar si el código interno es diferente
        if (prevState.codigoInterno !== producto.codigoInterno) {
          return { ...producto }
        }
        return prevState
      })
      setIsFormDirty(false) // Resetear el estado de modificación
    }
  }, [producto.codigoInterno])

  // Efecto para limpiar campos del Vademécum cuando se limpia principio activo
  useEffect(() => {
    if (!formState.principioActivo || formState.principioActivo.trim() === '') {
      // Verificar si hay contenido en alguno de los campos antes de limpiar
      if (formState.posologia || formState.contraindicaciones || 
          formState.sustitutoSugerido || formState.patologia) {
        setFormState(prevState => ({
          ...prevState,
          posologia: '',
          contraindicaciones: '',
          sustitutoSugerido: '',
          patologia: ''
        }));
        // Marcar el formulario como modificado
        setIsFormDirty(true);
      }
    }
  }, [formState.principioActivo]);

  const handleSuggestion = (fieldName: 'concentracion' | 'envase') => {
    if (!formState.nombreProducto) {
      toast({
        title: "No hay nombre de producto",
        description: "Por favor, ingrese el nombre del producto primero.",
        variant: "destructive"
      })
      return
    }

    const result = fieldName === 'concentracion' 
      ? parseConcentracion(formState.nombreProducto)
      : parseEnvase(formState.nombreProducto)

    if (result.found && result.value) {
      const field = fieldName === 'concentracion' ? 'concentracionDosis' : 'contenidoEnvase'
      setFormState(prev => ({
        ...prev,
        [field]: result.value
      }))
      setIsFormDirty(true)
      toast({
        title: "Sugerencia aplicada",
        description: `Se ha detectado: ${result.value}`
      })
    } else {
      toast({
        title: "No se encontró sugerencia",
        description: `No se pudo detectar ${fieldName === 'concentracion' ? 'concentración/dosis' : 'contenido del envase'} en el nombre del producto.`,
        variant: "destructive"
      })
    }
  }

  // Función para manejar el asistente de vademécum
  const handleAssistantClick = async () => {
    // Validar que haya un principio activo
    if (!formState.principioActivo?.trim()) {
      toast({
        title: "Principio Activo Requerido",
        description: "Por favor, ingrese el principio activo antes de usar el asistente.",
        variant: "destructive"
      })
      return
    }

    setIsAssistantLoading(true)
    try {
      const response = await fetch(
        `${SERVER_URL}/api/vademecum-suggestions?principioActivo=${encodeURIComponent(formState.principioActivo)}`
      )

      if (!response.ok) {
        throw new Error('No se encontraron sugerencias')
      }

      const suggestionData = await response.json()
      const disclaimer = "\n\n[Sugerencia basada en otro producto. Por favor, verifique y adapte si es necesario.]"

      setFormState(prevData => ({
        ...prevData,
        principioActivo: suggestionData.principioActivo || prevData.principioActivo,
        posologia: suggestionData.posologia ? suggestionData.posologia + disclaimer : prevData.posologia,
        contraindicaciones: suggestionData.contraindicaciones 
          ? suggestionData.contraindicaciones + disclaimer 
          : prevData.contraindicaciones,
        sustitutoSugerido: suggestionData.sustitutoSugerido 
          ? suggestionData.sustitutoSugerido + disclaimer 
          : prevData.sustitutoSugerido,
        patologia: suggestionData.patologia || prevData.patologia
      }))

      setIsFormDirty(true)
      toast({
        title: "Sugerencias Aplicadas",
        description: "La información del vademécum ha sido actualizada con las sugerencias."
      })
    } catch (error) {
      console.error('Error en el asistente:', error)
      toast({
        title: "No se encontraron sugerencias",
        description: "No se encontraron sugerencias para este principio activo.",
        variant: "destructive"
      })
    } finally {
      setIsAssistantLoading(false)
    }
  }
  
  // Estado para manejar la categorización del producto
  const [categorization, setCategorization] = useState({
    categoryId: producto.categoryId || null,
    subcategoryId: producto.subcategoryId || null,
    specific1Id: producto.specific1Id || null,
    specific2Id: producto.specific2Id || null,
  })

  // Efecto para resetear el estado cuando cambia el producto o se abre/cierra el modal
  useEffect(() => {
    console.log('Reseteando estado para producto:', producto.codigoInterno)
    setFormState({ 
      ...producto,
      // Asegurar valores por defecto para campos regulatorios
      paisFabricacion: producto.paisFabricacion || 'EC',
      requierePrescripcionMedica: producto.requierePrescripcionMedica || false,
      esPsicotropico: producto.esPsicotropico || false,
      requiereCadenaDeFrio: producto.requiereCadenaDeFrio || false,
    })
    setCategorization({
      categoryId: producto.categoryId || null,
      subcategoryId: producto.subcategoryId || null,
      specific1Id: producto.specific1Id || null,
      specific2Id: producto.specific2Id || null,
    })
    setIsFormDirty(false)
  }, [producto.codigoInterno, open])

  // Función para manejar cambios en el formulario
  const handleFormChange = (field: keyof ProductFormState, value: any) => {
    setFormState(prev => {
      const newState = { ...prev, [field]: value }
      // Verificar si hay cambios comparando con el producto original
      const hasChanges = JSON.stringify(newState) !== JSON.stringify(producto)
      setIsFormDirty(hasChanges)
      return newState
    })
  }

  // Función para guardar cambios
  const handleSave = async () => {
    try {
      setIsSaving(true)
      const response = await fetch(`${SERVER_URL}:8890/api/products/${producto.codigoInterno}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formState)
      })

      if (!response.ok) {
        throw new Error('Error al guardar los cambios')
      }

      toast({
        title: "Cambios guardados",
        description: "Los cambios se han guardado exitosamente.",
      })
      setIsFormDirty(false)
      onOpenChange(false)
    } catch (error) {
      console.error('Error guardando cambios:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron guardar los cambios. Por favor, intente nuevamente.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Función para manejar la selección completa de categorización desde el clon
  const handleCloneSelection = (newCategorization: {
    categoryId: number | null
    subcategoryId: number | null
    specific1Id: number | null
    specific2Id: number | null
  }) => {
    console.log('Aplicando categorización clonada:', newCategorization)
    // Actualizar ambos estados
    setCategorization(newCategorization)
    setFormState(prev => ({
      ...prev,
      ...newCategorization
    }))
    // Marcar el formulario como modificado
    setIsFormDirty(true)
  }

  // Función para manejar cambios individuales en la categorización
  const handleCategorizationChange = (field: string, value: number | null) => {
    console.log(`Actualizando categorización: ${field} = ${value}`)
    
    // Actualizar el estado de categorización local
    setCategorization(prev => ({
      ...prev,
      [field]: value
    }))

    // Actualizar el formState para reflejar los cambios
    setFormState(prev => ({
      ...prev,
      [field]: value
    }))

    // Marcar el formulario como modificado
    setIsFormDirty(true)
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
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <Button
            variant="default"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleSave}
            disabled={!isFormDirty || isSaving}
          >
            {isSaving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </div>
        
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

            <div className="w-full h-[60vh] overflow-hidden">
              <ScrollArea className="h-full w-full rounded-md border p-4 bg-[#f5f5dc] shadow-inner">
                <div className="pr-4">
                  <TabsContent value="identificacion">
                <Card>
                  <CardHeader>
                    <CardTitle>Información Básica</CardTitle>
                    <CardDescription>Datos principales de identificación del producto</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="codigoInterno">Código Interno</Label>
                      <Input id="codigoInterno" value={producto.codigoInterno} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="upc">UPC</Label>
                      <Input id="upc" value={producto.upc} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nombreProducto">Nombre del Producto</Label>
                      <Input 
                        id="nombreProducto" 
                        value={formState.nombreProducto}
                        onChange={(e) => handleFormChange('nombreProducto', e.target.value)}
                      />
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
                      <div className="flex justify-between items-center mb-4">
                        <Label>Nueva Categorización</Label>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsCloneDialogOpen(true)}
                        >
                          Copiar categorización de otro producto
                        </Button>
                      </div>
                      <CloneCategorization
                        open={isCloneDialogOpen}
                        onOpenChange={setIsCloneDialogOpen}
                        onProductSelect={handleCloneSelection}
                      />
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
                      <SearchableSelect
                        endpoint="/api/formas-farmaceuticas/activas"
                        value={formState.formaFarmaceuticaId || null}
                        onChange={(value) => handleFormChange('formaFarmaceuticaId', value)}
                        placeholder="Seleccionar forma farmacéutica..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="concentracionDosis">Concentración/Dosis</Label>
                      <SuggestionInput 
                        id="concentracionDosis" 
                        value={formState.concentracionDosis || ''} 
                        onChange={(e) => handleFormChange('concentracionDosis', e.target.value)}
                        onSuggest={() => handleSuggestion('concentracion')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contenidoEnvase">Contenido del Envase</Label>
                      <SuggestionInput 
                        id="contenidoEnvase" 
                        value={formState.contenidoEnvase || ''} 
                        onChange={(e) => handleFormChange('contenidoEnvase', e.target.value)}
                        onSuggest={() => handleSuggestion('envase')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="viaAdministracion">Vía de Administración</Label>
                      <SearchableSelect
                        endpoint="/api/vias-administracion/activas"
                        value={formState.viaAdministracionId || null}
                        onChange={(value) => handleFormChange('viaAdministracionId', value)}
                        placeholder="Seleccionar vía de administración..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="poblacionDiana">Población Diana</Label>
                      <SearchableSelect
                        endpoint="/api/poblaciones-diana/activas"
                        value={formState.poblacionDianaId || null}
                        onChange={(value) => handleFormChange('poblacionDianaId', value)}
                        placeholder="Seleccionar población diana..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tagsIndicaciones">Tags e Indicaciones</Label>
                      <TagSelect
                        key={`tags-${producto.codigoInterno}`}
                        value={formState.tags || []}
                        onChange={(tags) => {
                          handleFormChange('tags', tags)
                          setIsFormDirty(true)
                        }}
                        productId={producto.codigoInterno}
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
                  <CardContent>
                    <div className="space-y-6">
                      {/* País de Fabricación */}
                      <CountrySelect
                        id="paisFabricacion"
                        value={formState.paisFabricacion || 'EC'}
                        onChange={(value) => handleFormChange('paisFabricacion', value || 'EC')}
                        className="w-full lg:w-72"
                      />

                      {/* Opciones Regulatorias */}
                      <div className="divide-y divide-border">
                        <ToggleRow
                          id="requierePrescripcionMedica"
                          label="Requiere Prescripción Médica"
                          checked={formState.requierePrescripcionMedica}
                          onCheckedChange={(checked) => handleFormChange('requierePrescripcionMedica', checked)}
                        />

                        <ToggleRow
                          id="esPsicotropico"
                          label="Es Psicotrópico"
                          checked={formState.esPsicotropico}
                          onCheckedChange={(checked) => handleFormChange('esPsicotropico', checked)}
                        />

                        <ToggleRow
                          id="requiereCadenaDeFrio"
                          label="Requiere Cadena de Frío"
                          checked={formState.requiereCadenaDeFrio}
                          onCheckedChange={(checked) => handleFormChange('requiereCadenaDeFrio', checked)}
                        />
                      </div>
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
                    {/* Principio Activo */}
                    <PrincipioActivoSelect
                      value={formState.principioActivo || ''}
                      onChange={(value) => handleFormChange('principioActivo', value)}
                    />

                    {/* Botón del Asistente - Solo visible si los campos principales están vacíos */}
                    {(!formState.posologia || !formState.contraindicaciones || !formState.sustitutoSugerido) && (
                      <div className="mb-4">
                        <AssistantButton
                          onClick={handleAssistantClick}
                          isLoading={isAssistantLoading}
                          isDisabled={!formState.principioActivo?.trim()}
                        />
                      </div>
                    )}

                    {/* Campos de Vademécum */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="posologia">Posología</Label>
                        <Textarea 
                          id="posologia" 
                          value={formState.posologia || ''} 
                          onChange={(e) => handleFormChange('posologia', e.target.value)}
                          placeholder="Ingrese la posología..."
                          className="min-h-[100px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contraindicaciones">Contraindicaciones</Label>
                        <Textarea 
                          id="contraindicaciones" 
                          value={formState.contraindicaciones || ''} 
                          onChange={(e) => handleFormChange('contraindicaciones', e.target.value)}
                          placeholder="Ingrese las contraindicaciones..."
                          className="min-h-[100px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sustitutoSugerido">Sustituto Sugerido</Label>
                        <Textarea 
                          id="sustitutoSugerido" 
                          value={formState.sustitutoSugerido || ''} 
                          onChange={(e) => handleFormChange('sustitutoSugerido', e.target.value)}
                          placeholder="Ingrese el sustituto sugerido..."
                          className="min-h-[100px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="patologia">Patología</Label>
                        <Textarea 
                          id="patologia" 
                          value={formState.patologia || ''} 
                          onChange={(e) => handleFormChange('patologia', e.target.value)}
                          placeholder="Ingrese la patología..."
                          className="min-h-[100px]"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="imagenes">
                <Card>
                  <CardHeader>
                    <CardTitle>Galería de Imágenes</CardTitle>
                    <CardDescription>
                      Arrastra y suelta las imágenes para reordenarlas. 
                      Haz clic en el botón + para agregar nuevas imágenes.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ImageGallery
                      images={images}
                      productId={formState.codigoInterno}
                      onChange={(newImages) => {
                        setImages(newImages)
                        setIsFormDirty(true)
                      }}
                      className="w-full"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
                </div>
              </ScrollArea>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
