import { useState, useMemo } from 'react'
import AsyncCreatableSelect from 'react-select/async-creatable'
import { Label } from "@/components/ui/label"
import { SERVER_URL } from "@/config"

interface PrincipioActivoTag {
  value: string
  label: string
  __isNew__?: boolean
}

interface PrincipioActivoSelectProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function PrincipioActivoSelect({ value, onChange, className }: PrincipioActivoSelectProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Convertir el string inicial a formato de tags
  const selectedTags = useMemo(() => {
    return value
      .split(',')
      .map(name => name.trim())
      .filter(name => name)
      .map(name => ({ value: name, label: name }))
  }, [value])

  // Búsqueda de principios activos con debounce
  const loadSuggestions = async (inputValue: string) => {
    if (!inputValue) return []

    setIsLoading(true)
    try {
      const response = await fetch(
        `${SERVER_URL}/api/principios-activos/search?nombre=${encodeURIComponent(inputValue)}`
      )
      
      if (!response.ok) throw new Error('Error en la búsqueda')
      const data = await response.json()
      
      return data.map((item: { nombre: string }) => ({
        value: item.nombre,
        label: item.nombre
      }))
    } catch (error) {
      console.error('Error buscando principios activos:', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (newValue: readonly PrincipioActivoTag[]) => {
    const newStringValue = newValue
      .map(option => option.label.trim())
      .join(', ')
    onChange(newStringValue)
  }

  return (
    <div className={className}>
      <Label htmlFor="principioActivo" className="text-sm font-medium mb-1.5 block">
        Principio Activo
      </Label>
      <AsyncCreatableSelect
        id="principioActivo"
        value={selectedTags}
        onChange={handleChange}
        loadOptions={loadSuggestions}
        isMulti
        isClearable
        isSearchable
        isLoading={isLoading}
        placeholder="Buscar o agregar principios activos..."
        noOptionsMessage={() => "No se encontraron sugerencias"}
        formatCreateLabel={(inputValue) => `Crear "${inputValue}"`}
        classNames={{
          control: (state) => 
            'flex min-h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors ' +
            (state.isFocused ? 'ring-2 ring-ring ring-offset-2' : ''),
          placeholder: () => 'text-muted-foreground',
          input: () => 'text-sm',
          option: (state) => 
            'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none ' +
            (state.isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'),
          multiValue: () => 'bg-accent text-accent-foreground rounded px-1 mx-1 text-sm',
          menu: () => 'bg-popover text-popover-foreground',
        }}
      />
    </div>
  )
}
