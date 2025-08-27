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
import { CONFIG, buildImageUrl, buildApiUrl } from "@/config/urls"
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
  const [currentCompletionLevel, setCurrentCompletionLevel] = useState(0)

  // Estados para las opciones de los selectores (necesario para conversión ID ↔ Nombre)
  const [formaFarmaceuticaOptions, setFormaFarmaceuticaOptions] = useState<{id: number, nombre: string}[]>([])
  const [viaAdministracionOptions, setViaAdministracionOptions] = useState<{id: number, nombre: string}[]>([])
  const [poblacionDianaOptions, setPoblacionDianaOptions] = useState<{id: number, nombre: string}[]>([])
  
  // Estados para las opciones de categorización
  const [categoriaOptions, setCategoriaOptions] = useState<{id: number, nombre: string}[]>([])
  const [subcategoriaOptions, setSubcategoriaOptions] = useState<{id: number, nombre: string}[]>([])
  const [specific1Options, setSpecific1Options] = useState<{id: number, nombre: string}[]>([])
  const [specific2Options, setSpecific2Options] = useState<{id: number, nombre: string}[]>([])

  // Estado para controlar si las opciones están cargadas
  const [optionsLoaded, setOptionsLoaded] = useState(false)

  // Cargar opciones de los selectores al montar el componente
  useEffect(() => {
    const loadSelectOptions = async () => {
      try {
        const [formasResp, viasResp, poblacionesResp, categoriasResp] = await Promise.all([
          fetch(buildApiUrl('/api/formas-farmaceuticas/activas')),
          fetch(buildApiUrl('/api/vias-administracion/activas')),
          fetch(buildApiUrl('/api/poblaciones-diana/activas')),
          fetch(buildApiUrl('/api/categories/list')) // Endpoint correcto encontrado
        ])

        if (formasResp.ok) {
          const formasData = await formasResp.json()
          setFormaFarmaceuticaOptions(formasData)
          console.log('🔧 Formas farmacéuticas cargadas:', formasData)
        }
        
        if (viasResp.ok) {
          const viasData = await viasResp.json()
          setViaAdministracionOptions(viasData)
          console.log('🔧 Vías de administración cargadas:', viasData)
        }
        
        if (poblacionesResp.ok) {
          const poblacionesData = await poblacionesResp.json()
          setPoblacionDianaOptions(poblacionesData)
          console.log('🔧 Poblaciones diana cargadas:', poblacionesData)
        }

        if (categoriasResp.ok) {
          const categoriasData = await categoriasResp.json()
          setCategoriaOptions(categoriasData)
          console.log('🔧 Categorías principales cargadas:', categoriasData)
        }

        // Cargar todas las subcategorías y específicas para poder hacer el mapeo
        // Usar endpoints similares a los que usa CategoriaSelector
        try {
          // Probar diferentes endpoints para obtener todas las opciones
          const allSubcategoriesResp = await fetch(buildApiUrl('/api/subcategories/list'))
          const allSpecific1Resp = await fetch(buildApiUrl('/api/specific1/list'))
          const allSpecific2Resp = await fetch(buildApiUrl('/api/specific2/list'))

          if (allSubcategoriesResp.ok) {
            const subcategoriesData = await allSubcategoriesResp.json()
            setSubcategoriaOptions(subcategoriesData)
            console.log('🔧 Todas las subcategorías cargadas:', subcategoriesData.length, 'opciones')
          } else {
            console.log('⚠️ Endpoint /api/subcategories/list no disponible')
          }

          if (allSpecific1Resp.ok) {
            const specific1Data = await allSpecific1Resp.json()
            setSpecific1Options(specific1Data)
            console.log('🔧 Todas las specific1 cargadas:', specific1Data.length, 'opciones')
          } else {
            console.log('⚠️ Endpoint /api/specific1/list no disponible')
          }

          if (allSpecific2Resp.ok) {
            const specific2Data = await allSpecific2Resp.json()
            setSpecific2Options(specific2Data)
            console.log('🔧 Todas las specific2 cargadas:', specific2Data.length, 'opciones')
          } else {
            console.log('⚠️ Endpoint /api/specific2/list no disponible')
          }
        } catch (error) {
          console.log('⚠️ Algunos endpoints de categorización no están disponibles:', error)
          // No es crítico, continuamos sin estos datos
        }

        // Marcar las opciones como cargadas
        setOptionsLoaded(true)
        console.log('✅ Todas las opciones de selectores cargadas')
        
      } catch (error) {
        console.error('Error cargando opciones de selectores:', error)
        setOptionsLoaded(true) // Marcar como cargado aunque haya errores
      }
    }

    loadSelectOptions()
  }, [])

  // Función para mapear datos del backend al formato del frontend
  const mapBackendToFrontend = (backendProduct: any) => {
    console.log('🔄 Mapeando datos del backend al frontend...')
    console.log('📥 Datos recibidos del backend:', backendProduct)
    console.log('🔧 Opciones disponibles:')
    console.log('- formaFarmaceuticaOptions:', formaFarmaceuticaOptions.length)
    console.log('- viaAdministracionOptions:', viaAdministracionOptions.length)
    console.log('- poblacionDianaOptions:', poblacionDianaOptions.length)
    console.log('- categoriaOptions:', categoriaOptions.length)
    console.log('- subcategoriaOptions:', subcategoriaOptions.length)
    
    // Usar las opciones cargadas para hacer la conversión Nombre → ID
    const getIdByNombre = (opciones: {id: number, nombre: string}[], nombre: string | null): number | null => {
      if (!nombre || opciones.length === 0) {
        console.log(`⚠️ No se puede mapear "${nombre}" - opciones vacías o nombre nulo`)
        return null
      }
      const opcion = opciones.find(opt => opt.nombre.toLowerCase().trim() === nombre.toLowerCase().trim())
      console.log(`🔍 Mapeando "${nombre}" →`, opcion ? `ID: ${opcion.id}` : 'NO ENCONTRADO')
      return opcion ? opcion.id : null
    }

    // Convertir tags de string a array (si existe) - IDs se resolverán en TagSelect
    let tags = []
    if (backendProduct.tagsIndicaciones && backendProduct.tagsIndicaciones.trim()) {
      console.log('🏷️ Tags recibidos del backend:', backendProduct.tagsIndicaciones)
      const tagNames = backendProduct.tagsIndicaciones.split(',')
      tags = tagNames.map((name: string) => ({
        id: null, // TagSelect resolverá los IDs al cargar
        nombre: name.trim()
      })).filter(tag => tag.nombre.length > 0)
      console.log('🏷️ Tags convertidos para frontend:', tags)
    }

    const mappedProduct = {
      ...backendProduct,
      // === MAPEOS DE CAMPOS CRÍTICOS (usando opciones dinámicas) ===
      // Backend usa "formaFarmaceutica" (string) -> Frontend necesita "formaFarmaceuticaId" (number)
      formaFarmaceuticaId: getIdByNombre(formaFarmaceuticaOptions, backendProduct.formaFarmaceutica),
      
      // Backend usa "viaAdministracion" (string) -> Frontend necesita "viaAdministracionId" (number)  
      viaAdministracionId: getIdByNombre(viaAdministracionOptions, backendProduct.viaAdministracion),
      
      // Backend usa "poblacionDiana" (string) -> Frontend necesita "poblacionDianaId" (number)
      poblacionDianaId: getIdByNombre(poblacionDianaOptions, backendProduct.poblacionDiana),
      
      // Backend usa "concentracionDosis" -> Frontend necesita "concentracionDosis" (mismo nombre)
      concentracionDosis: backendProduct.concentracionDosis || null,
      
      // Backend usa "tagsIndicaciones" (string) -> Frontend necesita "tags" (array)
      tags: tags,

      // === DEBUG: Verificar tags en el resultado final ===
      _debugTags: {
        original: backendProduct.tagsIndicaciones,
        converted: tags,
        count: tags.length
      },

      // === MAPEOS DE CATEGORIZACIÓN ===
      // Priorizar IDs existentes sobre campos de texto null
      // Si categoriaPrincipal es null, usar categoryId para obtener el ID
      categoryId: backendProduct.categoryId || getIdByNombre(categoriaOptions, backendProduct.categoriaPrincipal),
      
      // Si subcategoria1 es null, usar subcategoryId 
      subcategoryId: backendProduct.subcategoryId || getIdByNombre(subcategoriaOptions, backendProduct.subcategoria1),
      
      // Si subcategoria2 es null, usar specific1Id
      specific1Id: backendProduct.specific1Id || getIdByNombre(specific1Options, backendProduct.subcategoria2),
      
      // Si subcategoria3 es null, usar specific2Id
      specific2Id: backendProduct.specific2Id || getIdByNombre(specific2Options, backendProduct.subcategoria3),

      // === PRESERVAR CAMPOS ORIGINALES PARA DEBUGGING ===
      _originalFormaFarmaceutica: backendProduct.formaFarmaceutica,
      _originalViaAdministracion: backendProduct.viaAdministracion,
      _originalPoblacionDiana: backendProduct.poblacionDiana,
      _originalTagsIndicaciones: backendProduct.tagsIndicaciones,
      _originalCategoriaPrincipal: backendProduct.categoriaPrincipal,
      _originalSubcategoria1: backendProduct.subcategoria1,
      _originalSubcategoria2: backendProduct.subcategoria2,
      _originalSubcategoria3: backendProduct.subcategoria3
    }

    console.log('📤 Producto mapeado para frontend:', {
      formaFarmaceuticaId: mappedProduct.formaFarmaceuticaId,
      viaAdministracionId: mappedProduct.viaAdministracionId,
      poblacionDianaId: mappedProduct.poblacionDianaId,
      concentracionDosis: mappedProduct.concentracionDosis,
      tags: mappedProduct.tags
    })

    return mappedProduct
  }

  // Efecto para inicializar el formulario solo cuando cambia el código interno del producto
  // COMENTADO TEMPORALMENTE - La lógica se consolidó en el useEffect de abajo
  /*
  useEffect(() => {
    if (producto?.codigoInterno) {
      console.log('🔄 Inicializando FormState con datos del producto:')
      console.log('📦 Datos completos del producto recibido:', producto)
      console.log('🔧 Campos específicos de atributos (ANTES del mapeo):')
      console.log('- formaFarmaceuticaId:', producto.formaFarmaceuticaId)
      console.log('- viaAdministracionId:', producto.viaAdministracionId)
      console.log('- poblacionDianaId:', producto.poblacionDianaId)
      console.log('- tags:', producto.tags)
      
      // Mapear datos del backend al frontend
      const mappedProduct = mapBackendToFrontend(producto)
      
      console.log('🔄 Después del mapeo:')
      console.log('- formaFarmaceuticaId:', mappedProduct.formaFarmaceuticaId)
      console.log('- viaAdministracionId:', mappedProduct.viaAdministracionId)
      console.log('- poblacionDianaId:', mappedProduct.poblacionDianaId)
      console.log('- tags:', mappedProduct.tags)
      
      setFormState(prevState => {
        // Solo actualizar si el código interno es diferente
        if (prevState.codigoInterno !== producto.codigoInterno) {
          console.log('📝 Nuevo FormState establecido:', mappedProduct)
          return mappedProduct
        }
        return prevState
      })
      setIsFormDirty(false) // Resetear el estado de modificación
    }
  }, [producto.codigoInterno])
  */

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
        buildApiUrl(`/api/vademecum-suggestions?principioActivo=${encodeURIComponent(formState.principioActivo)}`)
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
  // PERO SOLO después de que las opciones estén cargadas
  useEffect(() => {
    if (!optionsLoaded || !producto?.codigoInterno) {
      console.log('⏳ Esperando opciones o producto...', { optionsLoaded, codigoInterno: producto?.codigoInterno })
      return
    }

    console.log('🔄 Reseteando estado para producto:', producto.codigoInterno)
    console.log('✅ Opciones disponibles para mapeo')
    console.log('📦 Datos recibidos del backend:', {
      codigoInterno: producto.codigoInterno,
      tagsIndicaciones: (producto as any).tagsIndicaciones,
      tags: producto.tags
    })
    
    // Mapear los datos del backend al formato del frontend antes de inicializar el estado
    const mappedProduct = mapBackendToFrontend(producto)
    console.log('🔧 Producto mapeado para formState:', mappedProduct)
    console.log('🏷️ Debug tags específicamente:', {
      originalTagsIndicaciones: (producto as any).tagsIndicaciones,
      mappedTags: mappedProduct.tags,
      tagsCount: mappedProduct.tags?.length || 0,
      debugInfo: mappedProduct._debugTags
    })
    
    setFormState({ 
      ...mappedProduct,
      // Asegurar valores por defecto para campos regulatorios
      paisFabricacion: mappedProduct.paisFabricacion || 'EC',
      requierePrescripcionMedica: mappedProduct.requierePrescripcionMedica || false,
      esPsicotropico: mappedProduct.esPsicotropico || false,
      requiereCadenaDeFrio: mappedProduct.requiereCadenaDeFrio || false,
    })
    setCategorization({
      categoryId: mappedProduct.categoryId || null,
      subcategoryId: mappedProduct.subcategoryId || null,
      specific1Id: mappedProduct.specific1Id || null,
      specific2Id: mappedProduct.specific2Id || null,
    })
    setIsFormDirty(false)
    
    // Calcular nivel inicial de completación después de cargar datos
    setTimeout(() => {
      updateCompletionLevel()
    }, 100) // Pequeño delay para asegurar que el estado esté actualizado
  }, [producto.codigoInterno, open, optionsLoaded]) // Agregamos optionsLoaded como dependencia

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

  // Función para actualizar el nivel de completación en tiempo real
  const updateCompletionLevel = () => {
    try {
      const level = calculateCompletionLevel()
      setCurrentCompletionLevel(level)
    } catch (error) {
      console.error('Error calculando nivel de completación:', error)
    }
  }

  // Actualizar nivel de completación cuando cambien los datos
  useEffect(() => {
    if (optionsLoaded && formState.codigoInterno) {
      updateCompletionLevel()
    }
  }, [formState, images, categorization, optionsLoaded])

  // Función para calcular el nivel de completación del producto
  const calculateCompletionLevel = () => {
    let nivel = 0;
    let factors = [];
    
    // === NIVEL BASE (20%) ===
    // Datos básicos siempre deben estar (código, nombre, laboratorio)
    const hasBasicData = formState.codigoInterno && formState.nombreProducto && formState.laboratorio;
    if (hasBasicData) {
      nivel = 20;
      factors.push('✅ Datos básicos');
    } else {
      factors.push('❌ Datos básicos');
    }

    // === NIVEL 40% - Categorización completa ===
    const hasFullCategorization = categorization.categoryId && categorization.subcategoryId && 
        categorization.specific1Id && categorization.specific2Id;
    if (hasFullCategorization) {
      nivel = 40;
      factors.push('✅ Categorización completa');
    } else {
      // Categorización parcial puede dar puntos intermedios
      const partialCat = (categorization.categoryId ? 1 : 0) + 
                        (categorization.subcategoryId ? 1 : 0) + 
                        (categorization.specific1Id ? 1 : 0) + 
                        (categorization.specific2Id ? 1 : 0);
      if (partialCat > 0 && nivel >= 20) {
        nivel = 20 + (partialCat * 5); // 25%, 30%, 35% según categorías completas
        factors.push(`🟡 Categorización parcial (${partialCat}/4)`);
      } else {
        factors.push('❌ Categorización incompleta');
      }
    }

    // === NIVEL 60% - Atributos de filtro completos ===
    const hasAllAttributes = formState.formaFarmaceuticaId && formState.concentracionDosis && 
        formState.contenidoEnvase && formState.viaAdministracionId && 
        formState.poblacionDianaId && formState.tags && formState.tags.length > 0;
    
    if (hasAllAttributes && nivel >= 35) { // Permitir si tiene al menos categorización parcial
      nivel = 60;
      factors.push('✅ Atributos completos');
    } else if (nivel >= 35) {
      // Atributos parciales
      const attributeCount = (formState.formaFarmaceuticaId ? 1 : 0) + 
                            (formState.concentracionDosis ? 1 : 0) + 
                            (formState.contenidoEnvase ? 1 : 0) + 
                            (formState.viaAdministracionId ? 1 : 0) + 
                            (formState.poblacionDianaId ? 1 : 0) + 
                            (formState.tags && formState.tags.length > 0 ? 1 : 0);
      if (attributeCount > 0) {
        nivel = Math.max(nivel, 40 + (attributeCount * 3)); // Hasta 58% con atributos parciales
        factors.push(`🟡 Atributos parciales (${attributeCount}/6)`);
      } else {
        factors.push('❌ Atributos incompletos');
      }
    } else {
      factors.push('❌ Atributos incompletos');
    }

    // === NIVEL 80% - Vademécum completo ===
    const hasFullVademecum = formState.patologia && formState.posologia && 
        formState.contraindicaciones && formState.sustitutoSugerido;
    
    if (hasFullVademecum && nivel >= 50) { // Permitir si tiene atributos parciales
      nivel = 80;
      factors.push('✅ Vademécum completo');
    } else if (nivel >= 50) {
      // Vademécum parcial
      const vademecumCount = (formState.patologia ? 1 : 0) + 
                            (formState.posologia ? 1 : 0) + 
                            (formState.contraindicaciones ? 1 : 0) + 
                            (formState.sustitutoSugerido ? 1 : 0);
      if (vademecumCount > 0) {
        nivel = Math.max(nivel, 60 + (vademecumCount * 5)); // Hasta 80% con vademécum parcial
        factors.push(`🟡 Vademécum parcial (${vademecumCount}/4)`);
      } else {
        factors.push('❌ Vademécum vacío');
      }
    } else {
      factors.push('❌ Vademécum vacío');
    }

    // === NIVEL 100% - Imágenes agregadas ===
    if (images.length > 0 && nivel >= 70) { // Permitir si tiene al menos vademécum parcial
      nivel = 100;
      factors.push(`✅ Imágenes agregadas (${images.length})`);
    } else {
      factors.push(`❌ Sin imágenes (${images.length})`);
    }

    console.log('📊 Nivel de completación calculado:', nivel + '%');
    console.log('🔍 Factores de completación:', factors);

    return nivel;
  }

  // Función de payload completo mejorado (progresivo)
  const prepareCompletePayload = async () => {
    console.log('🔍 Preparando payload completo mejorado...')
    console.log('📋 FormState completo:', formState)
    console.log('🏷️ Categorization:', categorization)

    // Función para convertir ID a nombre usando las opciones cargadas
    const getNombreById = (opciones: {id: number, nombre: string}[], id: number | null): string | null => {
      if (!id || opciones.length === 0) {
        if (id) console.log(`⚠️ No se puede convertir ID ${id} - opciones vacías (${opciones.length} opciones)`)
        return null
      }
      const opcion = opciones.find(opt => opt.id === id)
      if (opcion) {
        console.log(`✅ Convirtiendo ID ${id} → "${opcion.nombre}"`)
      } else {
        console.log(`❌ ID ${id} NO ENCONTRADO en ${opciones.length} opciones`)
      }
      return opcion ? opcion.nombre : null
    }

    // Payload completo pero con campos validados
    const payload = {
      // === CAMPOS BÁSICOS (ya probados que funcionan) ===
      codigoInterno: formState.codigoInterno,
      nombre: formState.nombreProducto,
      laboratorio: formState.laboratorio || null,
      principioActivo: formState.principioActivo || null,
      concentracion: formState.concentracionDosis || null,
      activo: true,
      fechaUltimaModificacion: new Date().toISOString(),

      // === CAMPOS ADICIONALES VALIDADOS ===
      upc: formState.upc || null,
      descripcion: formState.nombreProducto || null,
      
      // === CAMPOS DE CATEGORIZACIÓN (convertir ID → Nombre para la BD) ===
      // Intentar obtener nombres desde IDs, con fallback a null si no se encuentra
      categoriaPrincipal: getNombreById(categoriaOptions, categorization.categoryId) || null,
      subcategoria1: getNombreById(subcategoriaOptions, categorization.subcategoryId) || null,
      subcategoria2: getNombreById(specific1Options, categorization.specific1Id) || null,
      subcategoria3: getNombreById(specific2Options, categorization.specific2Id) || null,

      // === MANTENER IDs PARA BACKWARD COMPATIBILITY (siempre incluir) ===
      categoryId: categorization.categoryId || null,
      subcategoryId: categorization.subcategoryId || null,
      specific1Id: categorization.specific1Id || null,
      specific2Id: categorization.specific2Id || null,

      // === CAMPOS DE ATRIBUTOS (convertir ID → Nombre para la BD) ===
      formaFarmaceutica: getNombreById(formaFarmaceuticaOptions, formState.formaFarmaceuticaId),
      contenidoEnvase: formState.contenidoEnvase || null,
      viaAdministracion: getNombreById(viaAdministracionOptions, formState.viaAdministracionId),
      poblacionDiana: getNombreById(poblacionDianaOptions, formState.poblacionDianaId),
      concentracionDosis: formState.concentracionDosis || null,

      // === TAGS (convertir array a string separado por comas) ===
      tagsIndicaciones: formState.tags && formState.tags.length > 0 
        ? formState.tags.map(tag => tag.nombre).join(', ') 
        : null,

      // === MANTENER tagIds PARA BACKWARD COMPATIBILITY ===
      ...(formState.tags && formState.tags.length > 0 && {
        tagIds: formState.tags.map(tag => parseInt(tag.id?.toString() || '0')).filter(id => id > 0)
      }),

      // Campos regulatorios
      paisFabricacion: formState.paisFabricacion || 'EC',
      requierePrescripcionMedica: Boolean(formState.requierePrescripcionMedica),
      esPsicotropico: Boolean(formState.esPsicotropico),
      requiereCadenaDeFrio: Boolean(formState.requiereCadenaDeFrio),

      // Campos de vademécum solo si tienen contenido
      ...(formState.patologia && { patologia: formState.patologia }),
      ...(formState.posologia && { posologia: formState.posologia }),
      ...(formState.contraindicaciones && { contraindicaciones: formState.contraindicaciones }),
      ...(formState.sustitutoSugerido && { sustitutoSugerido: formState.sustitutoSugerido }),

      // Nivel de completación y metadatos del sistema
      nivelCompletacion: 0, // Se calculará y actualizará después
      usuarioUltimaModificacion: 'admin' // Se actualizará después con el usuario real
    }

    // Debug específico para campos de atributos
    console.log('🔧 Debug campos de atributos (FormState → Payload):')
    console.log('- formaFarmaceuticaId:', formState.formaFarmaceuticaId, '→ formaFarmaceutica:', getNombreById(formaFarmaceuticaOptions, formState.formaFarmaceuticaId))
    console.log('- viaAdministracionId:', formState.viaAdministracionId, '→ viaAdministracion:', getNombreById(viaAdministracionOptions, formState.viaAdministracionId))
    console.log('- poblacionDianaId:', formState.poblacionDianaId, '→ poblacionDiana:', getNombreById(poblacionDianaOptions, formState.poblacionDianaId))
    console.log('- concentracionDosis:', formState.concentracionDosis)
    console.log('- contenidoEnvase:', formState.contenidoEnvase)  
    console.log('- tags:', formState.tags)

    // Debug específico para campos de categorización
    console.log('🏷️ Debug campos de categorización (Usar IDs existentes → Nombres):')
    console.log('- categoryId:', categorization.categoryId, '→ categoriaPrincipal:', getNombreById(categoriaOptions, categorization.categoryId) || 'null')
    console.log('- subcategoryId:', categorization.subcategoryId, '→ subcategoria1:', getNombreById(subcategoriaOptions, categorization.subcategoryId) || 'null')
    console.log('- specific1Id:', categorization.specific1Id, '→ subcategoria2:', getNombreById(specific1Options, categorization.specific1Id) || 'null')
    console.log('- specific2Id:', categorization.specific2Id, '→ subcategoria3:', getNombreById(specific2Options, categorization.specific2Id) || 'null')

    // Debug específico para tags
    console.log('🏷️ Debug tags (Array → String):')
    console.log('- formState.tags (array):', formState.tags)
    console.log('- tagsIndicaciones (string):', formState.tags && formState.tags.length > 0 ? formState.tags.map(tag => tag.nombre).join(', ') : null)

    console.log('📦 Payload completo mejorado preparado:', payload)
    
    // Debug específico del payload de atributos
    console.log('🎯 Debug payload atributos enviados (como texto):')
    console.log('- formaFarmaceutica en payload:', payload.formaFarmaceutica)
    console.log('- viaAdministracion en payload:', payload.viaAdministracion)
    console.log('- poblacionDiana en payload:', payload.poblacionDiana)
    console.log('- concentracionDosis en payload:', payload.concentracionDosis)
    console.log('- contenidoEnvase en payload:', payload.contenidoEnvase)
    
    // Debug específico del payload de categorización
    console.log('🏷️ Debug payload categorización enviados (como texto):')
    console.log('- categoriaPrincipal en payload:', payload.categoriaPrincipal)
    console.log('- subcategoria1 en payload:', payload.subcategoria1) 
    console.log('- subcategoria2 en payload:', payload.subcategoria2)
    console.log('- subcategoria3 en payload:', payload.subcategoria3)
    
    return payload
  }

  // Función para actualizar imágenes del producto
  const updateProductImages = async () => {
    try {
      console.log('📤 Actualizando imágenes del producto...')
      console.log('🖼️ Imágenes a procesar:', images)
      
      // Usar solo el formato v3 que funciona
      const imagePayloadv3 = {
        productId: parseInt(producto.codigoInterno),
        images: images.map((img, index) => {
          const fileName = img.rutaImagen.includes('/') 
            ? img.rutaImagen.split('/').pop() 
            : img.rutaImagen
          
          const fullPath = `/media/products/${fileName}`
          
          return {
            rutaImagen: fullPath,
            orden: index + 1,
            altText: img.altText || `Imagen ${index + 1} del producto`
          }
        })
      }

      console.log('📦 Payload v3 (único):', JSON.stringify(imagePayloadv3, null, 2))

      const response = await fetch(buildApiUrl(`/api/product-images/products/${producto.codigoInterno}/images/bulk-update`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(imagePayloadv3)
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('❌ Error actualizando imágenes:', errorData)
        console.error('❌ Payload enviado:', JSON.stringify(imagePayloadv3, null, 2))
        return false
      }
      
      const responseData = await response.text()
      console.log('✅ Imágenes actualizadas correctamente')
      console.log('📝 Respuesta:', responseData)
      return true
    } catch (error) {
      console.error('❌ Error en updateProductImages:', error)
      return false
    }
  }

  // Función para guardar cambios
  const handleSave = async () => {
    try {
      setIsSaving(true)

      // 1. Preparar payload completo mejorado
      const payload = await prepareCompletePayload()
      
      // 1.1 Calcular nivel de completación
      const completionLevel = calculateCompletionLevel()
      payload.nivelCompletacion = completionLevel
      
      // 1.2 Obtener usuario actual
      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}')
      payload.usuarioUltimaModificacion = userData.usuario || 'admin'
      
      console.log('📊 Nivel de completación calculado:', completionLevel + '%')
      console.log('👤 Usuario modificación:', payload.usuarioUltimaModificacion)

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
      
      const response = await fetch(buildApiUrl(`/api/products/${producto.codigoInterno}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('❌ Error del servidor:', errorData)
        throw new Error(`Error ${response.status}: ${errorData}`)
      }
      
      // Log de la respuesta del backend para debugging
      const backendResponse = await response.json()
      console.log('✅ Producto actualizado en servidor')
      console.log('📋 Respuesta completa del backend:', backendResponse)
      
      // Verificar específicamente los campos de atributos en la respuesta
      console.log('🔍 Verificación campos atributos en respuesta:')
      console.log('- formaFarmaceutica (texto):', backendResponse.formaFarmaceutica)
      console.log('- viaAdministracion (texto):', backendResponse.viaAdministracion)
      console.log('- poblacionDiana (texto):', backendResponse.poblacionDiana)
      console.log('- concentracionDosis:', backendResponse.concentracionDosis)
      console.log('- contenidoEnvase:', backendResponse.contenidoEnvase)
      
      // Verificar específicamente los campos de categorización en la respuesta
      console.log('🏷️ Verificación campos categorización en respuesta:')
      console.log('- categoriaPrincipal (texto):', backendResponse.categoriaPrincipal)
      console.log('- subcategoria1 (texto):', backendResponse.subcategoria1)
      console.log('- subcategoria2 (texto):', backendResponse.subcategoria2)
      console.log('- subcategoria3 (texto):', backendResponse.subcategoria3)
      console.log('- categoryId (ID):', backendResponse.categoryId)
      console.log('- subcategoryId (ID):', backendResponse.subcategoryId)
      console.log('- specific1Id (ID):', backendResponse.specific1Id)
      console.log('- specific2Id (ID):', backendResponse.specific2Id)

      // Verificar específicamente los tags en la respuesta
      console.log('🏷️ Verificación tags en respuesta:')
      console.log('- tagsIndicaciones (texto):', backendResponse.tagsIndicaciones)

      // 4. Actualizar imágenes si hay cambios
      const HABILITAR_IMAGENES = true // Volver a habilitar para pruebas
      
      if (HABILITAR_IMAGENES && images.length > 0) {
        console.log('📤 Actualizando imágenes...')
        const imageSuccess = await updateProductImages()
        if (!imageSuccess) {
          toast({
            title: "⚠️ Producto actualizado con advertencias",
            description: "El producto se guardó pero hubo problemas actualizando las imágenes.",
          })
          // No hacer return, continuar con el éxito del producto
        }
      } else if (images.length > 0) {
        console.log('⚠️ Imágenes detectadas pero endpoint deshabilitado temporalmente')
      }

      // 5. Éxito
      toast({
        title: "✅ Producto actualizado",
        description: `Todos los cambios se han guardado exitosamente. Completación: ${completionLevel}%`,
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

  // Cargar imágenes cuando el componente se monte o el código interno cambie
  useEffect(() => {
    const loadImages = async () => {
      try {
        console.log('Cargando imágenes para producto:', producto.codigoInterno);
        const response = await fetch(buildApiUrl(`/api/product-images/product/${producto.codigoInterno}`));
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
          // Usar la función centralizada para construir la URL de imagen
          const imageUrl = buildImageUrl(img.rutaImagen);
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
          {!optionsLoaded && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <div className="h-3 w-3 animate-spin rounded-full border border-gray-400 border-t-transparent"></div>
              Cargando opciones...
            </div>
          )}
          <Button
            variant="default"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleSave}
            disabled={!isFormDirty || isSaving || !optionsLoaded}
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
          {/* Indicador de nivel de completación dinámico */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground font-medium">Completación del producto</span>
                <span className="font-semibold text-primary">{currentCompletionLevel}%</span>
              </div>
              <Progress 
                value={currentCompletionLevel} 
                className="h-3" 
              />
            </div>
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
                        value={(() => {
                          console.log('🏷️ Renderizando TagSelect con valor:', formState.tags)
                          return formState.tags || []
                        })()}
                        onChange={(tags) => {
                          console.log('🏷️ TagSelect onChange llamado con:', tags)
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
