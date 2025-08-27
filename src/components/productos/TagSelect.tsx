import { useState, useEffect, useMemo } from 'react'
import AsyncCreatableSelect from 'react-select/async-creatable'
import debounce from 'lodash/debounce'
import { toast } from "@/components/ui/use-toast"
import { buildApiUrl } from "@/config/urls"

interface Tag {
  id: number | null
  nombre: string
}

interface TagOption {
  value: number | null
  label: string
  __isNew__?: boolean
}

interface ProductTag {
  idTag: number
  nombreTag: string
}

interface TagSelectProps {
  value: Tag[]
  onChange: (tags: Tag[]) => void
  productId: string
  className?: string
  isDisabled?: boolean
}

export function TagSelect({
  value,
  onChange,
  productId,
  className,
  isDisabled = false
}: TagSelectProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [initialTagOptions, setInitialTagOptions] = useState<TagOption[]>([])

  // Convertir el valor de entrada a formato de react-select
  const formattedValue = useMemo(() => 
    value.map(tag => ({
      value: tag.id,
      label: tag.nombre
    }))
  , [value])

  // Cargar opciones iniciales
  useEffect(() => {
    const fetchInitialTags = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/tags/activos?limit=1000'))
        if (!response.ok) throw new Error('Error al cargar tags iniciales')
        const data = await response.json()
        
        const options = data.map((tag: Tag) => ({
          value: tag.id,
          label: tag.nombre
        }))
        
        setInitialTagOptions(options)
      } catch (error) {
        console.error('Error cargando tags iniciales:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las sugerencias iniciales de tags."
        })
      }
    }

    fetchInitialTags()
  }, [])



  // Búsqueda de tags con debounce
  const loadTagSuggestions = debounce(async (inputValue: string, callback: (options: TagOption[]) => void) => {
    if (!inputValue) {
      callback([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(buildApiUrl(`/api/tags/search?nombre=${encodeURIComponent(inputValue)}`))
      if (!response.ok) throw new Error('Error en la búsqueda')
      const data = await response.json()
      
      console.log('Sugerencias de tags:', data)
      
      // Transformar los resultados al formato de react-select
      const options = data.map((tag: Tag) => ({
        value: tag.id,
        label: tag.nombre
      }))

      // Filtrar tags que ya están seleccionados
      const selectedValues = new Set(formattedValue.map(t => t.value))
      const filteredOptions = options.filter(option => !selectedValues.has(option.value))

      callback(filteredOptions)
    } catch (error) {
      console.error('Error buscando tags:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al buscar tags."
      })
      callback([])
    } finally {
      setIsLoading(false)
    }
  }, 300)

  const handleChange = (newValue: readonly TagOption[]) => {
    // Actualizar directamente el estado del formulario padre
    const formattedTags = newValue.map(item => ({
      id: item.__isNew__ ? null : item.value,
      nombre: item.label
    }))
    onChange(formattedTags)
  }

  return (
    <AsyncCreatableSelect
      key={`tags-${productId}`} // Key estable basada en el ID del producto
      isMulti
      value={formattedValue}
      onChange={handleChange}
      loadOptions={loadTagSuggestions}
      defaultOptions={initialTagOptions}
      cacheOptions
      isDisabled={isDisabled}
      isLoading={isLoading}
      placeholder="Seleccionar o crear tags..."
      noOptionsMessage={() => "No se encontraron tags"}
      formatCreateLabel={(inputValue) => `Crear nuevo tag "${inputValue}"`}
      className={className}
      classNames={{
        control: (state) => 
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background ' +
          (state.isFocused ? 'ring-2 ring-ring ring-offset-2' : ''),
        menu: () => 'bg-popover text-popover-foreground',
        option: (state) => 
          'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none ' +
          (state.isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'),
        multiValue: () => 'bg-accent text-accent-foreground rounded px-1 mx-1 text-sm',
      }}
    />
  )
}
