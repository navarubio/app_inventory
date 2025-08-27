import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2 } from 'lucide-react'
import { buildApiUrl } from "@/config/urls"

interface Option {
  id: number
  name: string
}

interface CategoriaSelectorProps {
  categoryId?: number | null
  subcategoryId?: number | null
  specific1Id?: number | null
  specific2Id?: number | null
  onChange: (field: string, value: number | null) => void
}

// Componente para mostrar el estado de carga
const LoadingIndicator = () => (
  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    <Loader2 className="h-3 w-3 animate-spin" />
    <span>Cargando opciones...</span>
  </div>
)

// Componente para mostrar el estado de error
const ErrorIndicator = () => (
  <div className="flex items-center gap-2 text-xs text-destructive">
    <AlertCircle className="h-3 w-3" />
    <span>Error al cargar las opciones</span>
  </div>
)

interface Category {
  categoryId: number;
  categoryName: string;
}

interface Subcategory {
  subcategoryId: number;
  subcategoryName: string;
}

interface Specific1 {
  specific1Id: number;
  specific1Name: string;
}

interface Specific2 {
  specific2Id: number;
  specific2Name: string;
}

export function CategoriaSelector({
  categoryId = null,
  subcategoryId = null,
  specific1Id = null,
  specific2Id = null,
  onChange
}: CategoriaSelectorProps) {
  // Estado para los datos de cada nivel
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [specifics1, setSpecifics1] = useState<Specific1[]>([])
  const [specifics2, setSpecifics2] = useState<Specific2[]>([])

  // Estado para el loading de cada nivel
  const [loading, setLoading] = useState({
    categories: false,
    subcategories: false,
    specifics1: false,
    specifics2: false
  })

  // Estado para errores
  const [error, setError] = useState({
    categories: false,
    subcategories: false,
    specifics1: false,
    specifics2: false
  })

  // 1. Cargar categorías al montar el componente
  useEffect(() => {
    const loadCategories = async () => {
      setLoading(prev => ({ ...prev, categories: true }))
      setError(prev => ({ ...prev, categories: false }))
      try {
        const response = await fetch(buildApiUrl('/api/categories/list'))
        if (!response.ok) throw new Error('Error al cargar categorías')
        const data = await response.json()
        setCategories(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Error cargando categorías:', err)
        setError(prev => ({ ...prev, categories: true }))
        setCategories([])
      } finally {
        setLoading(prev => ({ ...prev, categories: false }))
      }
    }
    loadCategories()
  }, [])

  // 2. Cargar subcategorías cuando cambia categoryId
  useEffect(() => {
    if (!categoryId) {
      setSubcategories([])
      return
    }

    const loadSubcategories = async () => {
      setLoading(prev => ({ ...prev, subcategories: true }))
      setError(prev => ({ ...prev, subcategories: false }))
      try {
        const response = await fetch(buildApiUrl(`/api/subcategories/category/${categoryId}/list`))
        if (!response.ok) throw new Error('Error al cargar subcategorías')
        const data = await response.json()
        setSubcategories(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Error cargando subcategorías:', err)
        setError(prev => ({ ...prev, subcategories: true }))
        setSubcategories([])
      } finally {
        setLoading(prev => ({ ...prev, subcategories: false }))
      }
    }
    loadSubcategories()
  }, [categoryId])

  // 3. Cargar específicos 1 cuando cambia subcategoryId
  useEffect(() => {
    if (!subcategoryId) {
      setSpecifics1([])
      return
    }

    const loadSpecifics1 = async () => {
      setLoading(prev => ({ ...prev, specifics1: true }))
      setError(prev => ({ ...prev, specifics1: false }))
      try {
        const response = await fetch(buildApiUrl(`/api/specific1/subcategory/${subcategoryId}/list`))
        if (!response.ok) throw new Error('Error al cargar específicos')
        const data = await response.json()
        setSpecifics1(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Error cargando específicos 1:', err)
        setError(prev => ({ ...prev, specifics1: true }))
        setSpecifics1([])
      } finally {
        setLoading(prev => ({ ...prev, specifics1: false }))
      }
    }
    loadSpecifics1()
  }, [subcategoryId])

  // 4. Cargar específicos 2 cuando cambia specific1Id
  useEffect(() => {
    if (!specific1Id) {
      setSpecifics2([])
      return
    }

    const loadSpecifics2 = async () => {
      setLoading(prev => ({ ...prev, specifics2: true }))
      setError(prev => ({ ...prev, specifics2: false }))
      try {
        const response = await fetch(buildApiUrl(`/api/specific2/specific1/${specific1Id}/list`))
        if (!response.ok) throw new Error('Error al cargar sub-específicos')
        const data = await response.json()
        setSpecifics2(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Error cargando específicos 2:', err)
        setError(prev => ({ ...prev, specifics2: true }))
        setSpecifics2([])
      } finally {
        setLoading(prev => ({ ...prev, specifics2: false }))
      }
    }
    loadSpecifics2()
  }, [specific1Id])

  // Manejadores de cambios - simplificados
  const handleCategoryChange = (value: string) => {
    const numValue = value ? parseInt(value) : null
    onChange('categoryId', numValue)
    onChange('subcategoryId', null)
    onChange('specific1Id', null)
    onChange('specific2Id', null)
  }

  const handleSubcategoryChange = (value: string) => {
    const numValue = value ? parseInt(value) : null
    onChange('subcategoryId', numValue)
    onChange('specific1Id', null)
    onChange('specific2Id', null)
  }

  const handleSpecific1Change = (value: string) => {
    const numValue = value ? parseInt(value) : null
    onChange('specific1Id', numValue)
    onChange('specific2Id', null)
  }

  const handleSpecific2Change = (value: string) => {
    const numValue = value ? parseInt(value) : null
    onChange('specific2Id', numValue)
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Categoría</Label>
        <Select
          value={categoryId?.toString() || ""}
          onValueChange={handleCategoryChange}
          disabled={loading.categories}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccione una categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem 
                key={category.categoryId} 
                value={category.categoryId.toString()}
              >
                {category.categoryName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {loading.categories && <LoadingIndicator />}
        {error.categories && <ErrorIndicator />}
      </div>

      <div className="space-y-2">
        <Label>Sub Categoría</Label>
        <Select
          value={subcategoryId?.toString() || ""}
          onValueChange={handleSubcategoryChange}
          disabled={!categoryId || loading.subcategories}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccione una sub categoría" />
          </SelectTrigger>
          <SelectContent>
            {subcategories.map((subcategory) => (
              <SelectItem 
                key={subcategory.subcategoryId} 
                value={subcategory.subcategoryId.toString()}
              >
                {subcategory.subcategoryName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {loading.subcategories && <LoadingIndicator />}
        {error.subcategories && <ErrorIndicator />}
      </div>

      <div className="space-y-2">
        <Label>Específico</Label>
        <Select
          value={specific1Id?.toString() || ""}
          onValueChange={handleSpecific1Change}
          disabled={!subcategoryId || loading.specifics1}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccione un específico" />
          </SelectTrigger>
          <SelectContent>
            {specifics1.map((specific) => (
              <SelectItem 
                key={specific.specific1Id} 
                value={specific.specific1Id.toString()}
              >
                {specific.specific1Name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {loading.specifics1 && <LoadingIndicator />}
        {error.specifics1 && <ErrorIndicator />}
      </div>

      <div className="space-y-2">
        <Label>Sub Específico</Label>
        <Select
          value={specific2Id?.toString() || ""}
          onValueChange={handleSpecific2Change}
          disabled={!specific1Id || loading.specifics2}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccione un sub específico" />
          </SelectTrigger>
          <SelectContent>
            {specifics2.map((specific) => (
              <SelectItem 
                key={specific.specific2Id} 
                value={specific.specific2Id.toString()}
              >
                {specific.specific2Name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {loading.specifics2 && <LoadingIndicator />}
        {error.specifics2 && <ErrorIndicator />}
      </div>
    </div>
  )
}
