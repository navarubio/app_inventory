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
import ImageGallery from "./ImageGallery"

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
  
  // Nombres de categorías (para mostrar en UI)
  categoriaPrincipal: string | null
  subcategoria1: string | null
  subcategoria2: string | null
  subcategoria3: string | null
  
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
  
  // Metadatos
  nivelCompletacion?: number
  fechaCreacionRegistro?: string
  fechaUltimaModificacion?: string | null
  usuarioUltimaModificacion?: string | null
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

  // Función para resolver nombres de categorías desde los IDs
  const resolveCategoryNames = async (categoryId: number | null, subcategoryId: number | null, specific1Id: number | null, specific2Id: number | null) => {
    const names = {
      categoriaPrincipal: null as string | null,
      subcategoria1: null as string | null,
      subcategoria2: null as string | null,
      subcategoria3: null as string | null
    }

    try {
      // Esta función debería obtener los nombres desde la API
      // Por ahora usamos mapeo básico de los valores conocidos
      const categoryMap: Record<number, string> = {
        1: "CONSUMO",
        2: "FARMACOS", 
        3: "DISPOSITIVOS MEDICOS",
        6: "EQUIPOS"
      }

      const subcategoryMap: Record<number, string> = {
        1: "TRATAMIENTOS Y SALUD",
        6: "CIRCULATORIO",
        2: "NUTRICION",
        3: "CUIDADO PERSONAL"
      }

      if (categoryId) {
        names.categoriaPrincipal = categoryMap[categoryId] || null
      }
      if (subcategoryId) {
        names.subcategoria1 = subcategoryMap[subcategoryId] || null
      }
      
      // TODO: Implementar resolución completa desde API
      
    } catch (error) {
      console.warn('⚠️ Error resolviendo nombres de categorías:', error)
    }

    return names
  }

  // Función para resolver nombres de atributos desde los IDs
  const resolveAttributeNames = (formState: ProductFormState) => {
    const resolved = { ...formState }

    // Mapeos básicos (TODO: obtener desde API)
    const formaFarmaceuticaMap: Record<number, string> = {
      1: "Tableta",
      2: "Cápsula", 
      3: "Gel",
      4: "Crema",
      5: "Solución"
    }

    const viaAdministracionMap: Record<number, string> = {
      1: "Tópica",
      2: "Oral",
      3: "Intravenosa",
      4: "Intramuscular",
      5: "Sublingual"
    }

    const poblacionDianaMap: Record<number, string> = {
      1: "Adultos",
      2: "Pediátrica",
      3: "Geriátrica",
      4: "Embarazadas"
    }

    // Resolver nombres si tenemos los IDs
    if (resolved.formaFarmaceuticaId && !resolved.formaFarmaceutica) {
      resolved.formaFarmaceutica = formaFarmaceuticaMap[resolved.formaFarmaceuticaId] || null
    }

    if (resolved.viaAdministracionId && !resolved.viaAdministracion) {
      resolved.viaAdministracion = viaAdministracionMap[resolved.viaAdministracionId] || null
    }

    if (resolved.poblacionDianaId && !resolved.poblacionDiana) {
      resolved.poblacionDiana = poblacionDianaMap[resolved.poblacionDianaId] || null
    }

    return resolved
  }
  
  // Nueva función mejorada con resolución de nombres
  const preparePayloadForSaveImproved = async () => {
    console.log('🔍 Estado actual del formulario:', formState)
    console.log('🔍 Estado de categorización:', categorization) 
    console.log('🖼️ Imágenes actuales:', images)

    // Resolver nombres de atributos
    const resolvedFormState = resolveAttributeNames(formState)
    
    // Resolver nombres de categorías
    const categoryNames = await resolveCategoryNames(
      categorization.categoryId,
      categorization.subcategoryId,
      categorization.specific1Id,
      categorization.specific2Id
    )

    // Preparar el payload con todos los datos (mapeo para backend)
    const payload = {
      // === DATOS INMUTABLES ===
      codigoInterno: resolvedFormState.codigoInterno,
      upc: resolvedFormState.upc || null,
      nombre: resolvedFormState.nombreProducto, // Backend espera 'nombre'
      descripcion: resolvedFormState.nombreProducto || null, // Usar nombre como descripción por ahora
      laboratorio: resolvedFormState.laboratorio || null,
      categoriaOriginal: resolvedFormState.categoriaOriginal || null,
      presentacionOriginal: resolvedFormState.presentacionOriginal || null,
      nivelCompletacion: parseInt(resolvedFormState.nivelCompletacion?.toString() || '0'),
      fechaCreacionRegistro: resolvedFormState.fechaCreacionRegistro,

      // === TAB 1: CATEGORIZACIÓN ===
      categoryId: parseInt(categorization.categoryId?.toString() || '0'),
      subcategoryId: categorization.subcategoryId ? parseInt(categorization.subcategoryId.toString()) : null,
      specific1Id: categorization.specific1Id ? parseInt(categorization.specific1Id.toString()) : null,
      specific2Id: categorization.specific2Id ? parseInt(categorization.specific2Id.toString()) : null,
      categoriaPrincipal: categoryNames.categoriaPrincipal || null,
      subcategoria1: categoryNames.subcategoria1 || null,
      subcategoria2: categoryNames.subcategoria2 || null,
      subcategoria3: categoryNames.subcategoria3 || null,

      // === TAB 2: ATRIBUTOS DE FILTRO ===
      principioActivo: resolvedFormState.principioActivo || null,
      concentracion: resolvedFormState.concentracionDosis || null, // Backend espera 'concentracion'
      formaFarmaceuticaId: resolvedFormState.formaFarmaceuticaId ? parseInt(resolvedFormState.formaFarmaceuticaId.toString()) : null,
      contenidoEnvase: resolvedFormState.contenidoEnvase || null,
      viaAdministracionId: resolvedFormState.viaAdministracionId ? parseInt(resolvedFormState.viaAdministracionId.toString()) : null,
      poblacionDianaId: resolvedFormState.poblacionDianaId ? parseInt(resolvedFormState.poblacionDianaId.toString()) : null,
      // Convertir tags a array de IDs (si los tenemos)
      tagIds: resolvedFormState.tags && resolvedFormState.tags.length > 0 
        ? resolvedFormState.tags.map(tag => parseInt(tag.id?.toString() || '0')).filter(id => id > 0)
        : [],

      // === TAB 3: REGULATORIOS ===
      paisFabricacion: resolvedFormState.paisFabricacion || 'EC',
      requierePrescripcionMedica: Boolean(resolvedFormState.requierePrescripcionMedica),
      esPsicotropico: Boolean(resolvedFormState.esPsicotropico),
      requiereCadenaDeFrio: Boolean(resolvedFormState.requiereCadenaDeFrio),

      // === TAB 4: VADEMÉCUM (campos adicionales) ===
      patologia: resolvedFormState.patologia || null,
      posologia: resolvedFormState.posologia || null,
      contraindicaciones: resolvedFormState.contraindicaciones || null,
      sustitutoSugerido: resolvedFormState.sustitutoSugerido || null,

      // === CAMPOS ADICIONALES QUE PUEDE ESPERAR EL BACKEND ===
      activo: true, // Asumir que está activo
      stock: 0, // Campo requerido por backend pero no manejado en UI
      stockMinimo: 0, // Campo requerido por backend pero no manejado en UI
      precio: 0.0, // Campo requerido por backend pero no manejado en UI
      costo: 0.0, // Campo requerido por backend pero no manejado en UI

      // === METADATOS AUTOMÁTICOS ===
      fechaUltimaModificacion: new Date().toISOString(),
      usuarioUltimaModificacion: 'admin'
    }

    console.log('📦 Payload preparado con resolución completa:', payload)
    return payload
  }

  // Función de payload simplificado para pruebas
  const prepareSimplifiedPayload = () => {
    console.log('🔍 Preparando payload simplificado para pruebas...')
    
    const payload = {
      codigoInterno: formState.codigoInterno,
      nombre: formState.nombreProducto,
      laboratorio: formState.laboratorio,
      categoryId: categorization.categoryId,
      principioActivo: formState.principioActivo,
      concentracion: formState.concentracionDosis,
      activo: true,
      fechaUltimaModificacion: new Date().toISOString()
    }

    console.log('📦 Payload simplificado:', payload)
    return payload
  }

  // Función de payload completo mejorado (progresivo)
  const prepareCompletePayload = async () => {
    console.log('🔍 Preparando payload completo mejorado...')
    
    // Resolver nombres de atributos
    const resolvedFormState = resolveAttributeNames(formState)
    
    // Resolver nombres de categorías
    const categoryNames = await resolveCategoryNames(
      categorization.categoryId,
      categorization.subcategoryId,
      categorization.specific1Id,
      categorization.specific2Id
    )

    // Payload completo pero con campos validados
    const payload = {
      // === CAMPOS BÁSICOS (ya probados que funcionan) ===
      codigoInterno: resolvedFormState.codigoInterno,
      nombre: resolvedFormState.nombreProducto,
      laboratorio: resolvedFormState.laboratorio || null,
      categoryId: parseInt(categorization.categoryId?.toString() || '0'),
      principioActivo: resolvedFormState.principioActivo || null,
      concentracion: resolvedFormState.concentracionDosis || null,
      activo: true,
      fechaUltimaModificacion: new Date().toISOString(),

      // === CAMPOS ADICIONALES VALIDADOS ===
      upc: resolvedFormState.upc || null,
      descripcion: resolvedFormState.nombreProducto || null,
      
      // Solo incluir subcategorías si tienen valores válidos
      ...(categorization.subcategoryId && { 
        subcategoryId: parseInt(categorization.subcategoryId.toString()) 
      }),
      ...(categorization.specific1Id && { 
        specific1Id: parseInt(categorization.specific1Id.toString()) 
      }),
      ...(categorization.specific2Id && { 
        specific2Id: parseInt(categorization.specific2Id.toString()) 
      }),

      // Campos de atributos solo si tienen valores
      ...(resolvedFormState.formaFarmaceuticaId && { 
        formaFarmaceuticaId: parseInt(resolvedFormState.formaFarmaceuticaId.toString()) 
      }),
      ...(resolvedFormState.contenidoEnvase && { 
        contenidoEnvase: resolvedFormState.contenidoEnvase 
      }),
      ...(resolvedFormState.viaAdministracionId && { 
        viaAdministracionId: parseInt(resolvedFormState.viaAdministracionId.toString()) 
      }),
      ...(resolvedFormState.poblacionDianaId && { 
        poblacionDianaId: parseInt(resolvedFormState.poblacionDianaId.toString()) 
      }),

      // Tags solo si hay elementos válidos
      ...(resolvedFormState.tags && resolvedFormState.tags.length > 0 && {
        tagIds: resolvedFormState.tags.map(tag => parseInt(tag.id?.toString() || '0')).filter(id => id > 0)
      }),

      // Campos regulatorios
      paisFabricacion: resolvedFormState.paisFabricacion || 'EC',
      requierePrescripcionMedica: Boolean(resolvedFormState.requierePrescripcionMedica),
      esPsicotropico: Boolean(resolvedFormState.esPsicotropico),
      requiereCadenaDeFrio: Boolean(resolvedFormState.requiereCadenaDeFrio),

      // Campos de vademécum solo si tienen contenido
      ...(resolvedFormState.patologia && { patologia: resolvedFormState.patologia }),
      ...(resolvedFormState.posologia && { posologia: resolvedFormState.posologia }),
      ...(resolvedFormState.contraindicaciones && { contraindicaciones: resolvedFormState.contraindicaciones }),
      ...(resolvedFormState.sustitutoSugerido && { sustitutoSugerido: resolvedFormState.sustitutoSugerido }),

      // Metadatos del sistema
      usuarioUltimaModificacion: 'admin'
    }

    console.log('📦 Payload completo mejorado preparado:', payload)
    return payload
  }
  const preparePayloadForSave = () => {
    console.log('🔍 Estado actual del formulario:', formState)
    console.log('� Estado de categorización:', categorization)
    console.log('�🖼️ Imágenes actuales:', images)

    // Preparar el payload con todos los datos
    const payload = {
      // === DATOS INMUTABLES ===
      codigoInterno: formState.codigoInterno,
      upc: formState.upc,
      nombreProducto: formState.nombreProducto,
      presentacionOriginal: formState.presentacionOriginal,
      laboratorio: formState.laboratorio,
      categoriaOriginal: formState.categoriaOriginal,
      nivelCompletacion: formState.nivelCompletacion,
      fechaCreacionRegistro: formState.fechaCreacionRegistro,

      // === TAB 1: CATEGORIZACIÓN (desde estado categorization) ===
      categoryId: categorization.categoryId,
      subcategoryId: categorization.subcategoryId,
      specific1Id: categorization.specific1Id,
      specific2Id: categorization.specific2Id,
      categoriaPrincipal: formState.categoriaPrincipal || null,
      subcategoria1: formState.subcategoria1 || null,
      subcategoria2: formState.subcategoria2 || null,
      subcategoria3: formState.subcategoria3 || null,

      // === TAB 2: ATRIBUTOS DE FILTRO ===
      formaFarmaceutica: formState.formaFarmaceutica || null,
      concentracionDosis: formState.concentracionDosis || null,
      contenidoEnvase: formState.contenidoEnvase || null,
      viaAdministracion: formState.viaAdministracion || null,
      poblacionDiana: formState.poblacionDiana || null,
      // Convertir tags a string separado por comas
      tagsIndicaciones: formState.tags && formState.tags.length > 0 
        ? formState.tags.map(tag => tag.nombre).join(',')
        : null,

      // === TAB 3: REGULATORIOS ===
      paisFabricacion: formState.paisFabricacion || 'EC',
      requierePrescripcionMedica: Boolean(formState.requierePrescripcionMedica),
      esPsicotropico: Boolean(formState.esPsicotropico),
      requiereCadenaDeFrio: Boolean(formState.requiereCadenaDeFrio),

      // === TAB 4: VADEMÉCUM ===
      principioActivo: formState.principioActivo || null,
      patologia: formState.patologia || null,
      posologia: formState.posologia || null,
      contraindicaciones: formState.contraindicaciones || null,
      sustitutoSugerido: formState.sustitutoSugerido || null,

      // === METADATOS AUTOMÁTICOS ===
      fechaUltimaModificacion: new Date().toISOString(),
      usuarioUltimaModificacion: 'admin' // TODO: Obtener del contexto de usuario
    }

    console.log('📦 Payload preparado:', payload)
    return payload
  }

  // Función para validar los datos antes de enviar
  const validateFormData = (payload: any) => {
    const errors: string[] = []

    // === VALIDACIONES CRÍTICAS ===
    if (!payload.codigoInterno) {
      errors.push('Código interno es obligatorio')
    }

    if (!payload.nombre) { // Cambiado de nombreProducto a nombre
      errors.push('Nombre del producto es obligatorio')
    }

    // === VALIDACIONES DE CATEGORIZACIÓN ===
    if (!payload.categoryId) {
      errors.push('Debe seleccionar al menos una categoría principal')
    }

    // === VALIDACIONES DE FORMATO ===
    if (payload.concentracion) { // Cambiado de concentracionDosis a concentracion
      // Validar formato básico de concentración - permitir más flexibilidad
      const concentracionRegex = /^[\d\s.,]+[a-zA-Z%\/\s]*$/
      if (!concentracionRegex.test(payload.concentracion.trim())) {
        errors.push('Formato de concentración/dosis inválido (ej: 500mg, 30 G, 10ml)')
      }
    }

    if (payload.contenidoEnvase) {
      // Validar que contenga al menos un número
      const contieneNumero = /\d/.test(payload.contenidoEnvase)
      if (!contieneNumero) {
        errors.push('Contenido del envase debe contener un valor numérico')
      }
    }

    // === VALIDACIONES DE VADEMÉCUM ===
    if (payload.principioActivo && payload.principioActivo.length < 3) {
      errors.push('Principio activo debe tener al menos 3 caracteres')
    }

    // === VALIDACIÓN DE TAGS ===
    if (payload.tagIds && payload.tagIds.length > 10) { // Cambiado a tagIds
      errors.push('No se pueden agregar más de 10 tags')
    }

    console.log('🚨 Errores de validación:', errors)
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Función para mostrar vista previa de datos (debugging)
  const handlePreviewData = async () => {
    const payload = await preparePayloadForSaveImproved()
    const validation = validateFormData(payload)
    
    console.group('🔍 VISTA PREVIA COMPLETA DE DATOS')
    console.group('📦 PAYLOAD DEL PRODUCTO')
    console.log('🆔 Identificación:', {
      codigoInterno: payload.codigoInterno,
      upc: payload.upc,
      nombre: payload.nombre, // Mapeo correcto para backend
      laboratorio: payload.laboratorio
    })
    console.log('🏷️ Categorización:', {
      categoryId: payload.categoryId,
      subcategoryId: payload.subcategoryId,
      specific1Id: payload.specific1Id,
      specific2Id: payload.specific2Id,
      categoriaPrincipal: payload.categoriaPrincipal,
      subcategoria1: payload.subcategoria1,
      subcategoria2: payload.subcategoria2,
      subcategoria3: payload.subcategoria3
    })
    console.log('💊 Atributos de Filtro:', {
      principioActivo: payload.principioActivo,
      concentracion: payload.concentracion, // Mapeo correcto para backend
      formaFarmaceuticaId: payload.formaFarmaceuticaId,
      contenidoEnvase: payload.contenidoEnvase,
      viaAdministracionId: payload.viaAdministracionId,
      poblacionDianaId: payload.poblacionDianaId,
      tagIds: payload.tagIds // Array de IDs para backend
    })
    console.log('🏛️ Regulatorios:', {
      paisFabricacion: payload.paisFabricacion,
      requierePrescripcionMedica: payload.requierePrescripcionMedica,
      esPsicotropico: payload.esPsicotropico,
      requiereCadenaDeFrio: payload.requiereCadenaDeFrio
    })
    console.log('� Vademécum:', {
      principioActivo: payload.principioActivo,
      patologia: payload.patologia,
      posologia: payload.posologia,
      contraindicaciones: payload.contraindicaciones,
      sustitutoSugerido: payload.sustitutoSugerido
    })
    console.groupEnd()
    
    console.group('🖼️ IMÁGENES')
    console.log('Total de imágenes:', images.length)
    images.forEach((img, index) => {
      console.log(`Imagen ${index + 1}:`, {
        rutaImagen: img.rutaImagen,
        orden: index + 1,
        altText: img.altText
      })
    })
    console.groupEnd()
    
    console.group('✅ VALIDACIÓN')
    console.log('Estado:', validation.isValid ? '✅ VÁLIDO' : '❌ CON ERRORES')
    if (!validation.isValid) {
      console.log('Errores encontrados:', validation.errors)
    }
    console.groupEnd()
    
    console.groupEnd()
    
    // Crear resumen para el toast
    const resumen = `
📊 RESUMEN DE DATOS:
• Categorización: ${payload.categoryId ? '✅ Completa' : '❌ Pendiente'}
• Atributos: ${payload.formaFarmaceuticaId || payload.concentracion || payload.contenidoEnvase ? '✅ Algunos' : '⚠️ Vacíos'}
• Vademécum: ${payload.principioActivo ? '✅ Con PA' : '⚠️ Sin PA'}
• Imágenes: ${images.length > 0 ? `✅ ${images.length} img(s)` : '⚠️ Sin imágenes'}
• Estado: ${validation.isValid ? '✅ Listo para guardar' : '❌ Requiere corrección'}
    `
    
    toast({
      title: "🔍 Vista Previa Completa",
      description: `Ver consola para detalles completos.${resumen}`
    })
  }
  const updateProductImages = async () => {
    try {
      // Preparar payload de imágenes
      const imagePayload = {
        images: images.map((img, index) => ({
          rutaImagen: img.rutaImagen,
          orden: index + 1,
          altText: img.altText || `Imagen ${index + 1} del producto ${formState.codigoInterno}`
        }))
      }

      console.log('🖼️ Payload de imágenes:', imagePayload)

      // TEMPORAL: Mock del endpoint hasta que esté implementado en backend
      const USAR_MOCK_IMAGES = false // ✅ Cambiar a false - backend está listo!
      
      if (USAR_MOCK_IMAGES) {
        console.log('🔄 Mock imágenes: Backend no implementado aún')
        console.log('🖼️ Payload de imágenes que se enviaría:', JSON.stringify(imagePayload, null, 2))
        
        // Simular delay del servidor
        await new Promise(resolve => setTimeout(resolve, 500))
        
        console.log('✅ Mock: Imágenes actualizadas exitosamente')
      } else {
        // Código real para cuando el backend esté listo
        const response = await fetch(`${SERVER_URL}:8890/api/product-images/products/${formState.codigoInterno}/images/bulk-update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(imagePayload)
        })

        if (!response.ok) {
          const errorData = await response.text()
          console.warn('⚠️ Error actualizando imágenes:', errorData)
          // No fallar completamente si las imágenes fallan, solo avisar
          toast({
            title: "⚠️ Advertencia",
            description: "El producto se guardó pero hubo problemas actualizando las imágenes."
          })
        } else {
          console.log('✅ Imágenes actualizadas correctamente en servidor real')
        }
      }
    } catch (error) {
      console.warn('⚠️ Error en updateProductImages:', error)
      // No lanzar el error para no interrumpir el flujo principal
    }
  }

  // Función para probar guardado con payload simplificado
  const handleSaveSimplified = async () => {
    try {
      setIsSaving(true)
      
      // Usar payload simplificado
      const payload = prepareSimplifiedPayload()
      
      console.log('📤 Probando con payload simplificado...')
      console.log('📤 Enviando payload simplificado al servidor:', JSON.stringify(payload, null, 2))
      
      const response = await fetch(`${SERVER_URL}:8890/api/products/${producto.codigoInterno}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('❌ Error del servidor (payload simplificado):', errorData)
        throw new Error(`Error ${response.status}: ${errorData}`)
      }
      
      console.log('✅ Producto actualizado con payload simplificado')
      
      toast({
        title: "✅ Producto actualizado (Simplificado)",
        description: "Los cambios básicos se han guardado exitosamente.",
      })
      
      setIsFormDirty(false)
      
    } catch (error) {
      console.error('❌ Error guardando con payload simplificado:', error)
      toast({
        variant: "destructive",
        title: "Error al guardar (Simplificado)",
        description: error instanceof Error ? error.message : "Error desconocido",
      })
    } finally {
      setIsSaving(false)
    }
  }
  const handleSave = async () => {
    try {
      setIsSaving(true)

      // 1. Preparar payload completo mejorado
      const payload = await prepareCompletePayload()

      // 2. Validar datos básicos
      if (!payload.codigoInterno || !payload.nombre) {
        toast({
          variant: "destructive",
          title: "Datos inválidos",
          description: "Código interno y nombre son obligatorios"
        })
        return
      }

      // 3. Enviar datos del producto
      console.log('📤 Enviando datos del producto completo...')
      console.log('📤 Payload completo:', JSON.stringify(payload, null, 2))
      console.log('🌐 URL del endpoint:', `${SERVER_URL}:8890/api/products/${producto.codigoInterno}`)
      
      const response = await fetch(`${SERVER_URL}:8890/api/products/${producto.codigoInterno}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      console.log('� Respuesta del servidor - Status:', response.status)

      if (!response.ok) {
        const errorData = await response.text()
        console.error('❌ Error del servidor:', errorData)
        console.error('❌ Payload enviado:', JSON.stringify(payload, null, 2))
        throw new Error(`Error ${response.status}: ${errorData}`)
      }
      
      const responseData = await response.text()
      console.log('✅ Producto actualizado en servidor real')
      console.log('📝 Respuesta completa:', responseData)

      // 4. Actualizar imágenes si hay cambios
      if (images.length > 0) {
        console.log('📤 Actualizando imágenes...')
        await updateProductImages()
      }

      // 5. Éxito
      toast({
        title: "✅ Producto actualizado",
        description: "Todos los cambios se han guardado exitosamente.",
      })
      setIsFormDirty(false)
      onOpenChange(false)

    } catch (error) {
      console.error('❌ Error guardando cambios:', error)
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: error instanceof Error ? error.message : "No se pudieron guardar los cambios. Por favor, intente nuevamente.",
      })
    } finally {
      setIsSaving(false)
    }
  }

        if (!response.ok) {
          const errorData = await response.text()
          console.error('❌ Error del servidor:', errorData)
          console.error('❌ Payload enviado:', JSON.stringify(payload, null, 2))
          throw new Error(`Error ${response.status}: ${errorData}`)
        }
        
        const responseData = await response.text()
        console.log('✅ Producto actualizado en servidor real')
        console.log('📝 Respuesta completa:', responseData)
      }

      // 4. Actualizar imágenes si hay cambios
      if (images.length > 0) {
        console.log('📤 Actualizando imágenes...')
        await updateProductImages()
      }

      // 5. Éxito
      toast({
        title: "✅ Producto actualizado",
        description: "Todos los cambios se han guardado exitosamente.",
      })
      setIsFormDirty(false)
      onOpenChange(false)

    } catch (error) {
      console.error('❌ Error guardando cambios:', error)
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: error instanceof Error ? error.message : "No se pudieron guardar los cambios. Por favor, intente nuevamente.",
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
            variant="outline"
            onClick={handlePreviewData}
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            🔍 Vista Previa
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveSimplified}
            className="border-orange-200 text-orange-600 hover:bg-orange-50"
            disabled={!isFormDirty || isSaving}
          >
            🧪 Probar Simple
          </Button>
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
                      productId={parseInt(formState.codigoInterno)}
                      onImagesUpdate={(newImages) => {
                        setImages(newImages)
                        setIsFormDirty(true)
                      }}
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
