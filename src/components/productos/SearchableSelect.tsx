import { useEffect, useState } from 'react'
import Select from 'react-select'
import { toast } from "@/components/ui/use-toast"
import { buildApiUrl } from "@/config/urls"

interface Option {
  id: number
  nombre: string
}

interface SearchableSelectProps {
  endpoint: string
  value: number | null
  onChange: (value: number | null) => void
  placeholder: string
  className?: string
  isDisabled?: boolean
}

export function SearchableSelect({
  endpoint,
  value,
  onChange,
  placeholder,
  className,
  isDisabled = false
}: SearchableSelectProps) {
  const [options, setOptions] = useState<Option[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(buildApiUrl(endpoint))
        if (!response.ok) {
          throw new Error('Error al cargar las opciones')
        }
        const data = await response.json()
        setOptions(data)
      } catch (error) {
        console.error('Error cargando opciones:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las opciones. Por favor, intente nuevamente."
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchOptions()
  }, [endpoint])

  const selectedOption = options.find(opt => opt.id === value)

  return (
    <Select
      value={selectedOption ? { value: selectedOption.id, label: selectedOption.nombre } : null}
      onChange={(newValue) => onChange(newValue ? newValue.value : null)}
      options={options.map(opt => ({
        value: opt.id,
        label: opt.nombre
      }))}
      isLoading={isLoading}
      isDisabled={isDisabled || isLoading}
      placeholder={placeholder}
      className={className}
      classNames={{
        control: (state) => 
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background ' +
          (state.isFocused ? 'ring-2 ring-ring ring-offset-2' : ''),
        menu: () => 'bg-popover text-popover-foreground',
        option: (state) => 
          'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none ' +
          (state.isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'),
      }}
    />
  )
}
