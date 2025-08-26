import { useMemo } from 'react'
import Select from 'react-select'
import { Label } from "@/components/ui/label"
import { getNames, getCode } from 'country-list'

interface CountrySelectProps {
  id?: string
  value: string | null
  onChange: (value: string | null) => void
  className?: string
}

export function CountrySelect({ id, value, onChange, className }: CountrySelectProps) {
  // Generar las opciones de países una sola vez
  const countryOptions = useMemo(() => {
    const countries = getNames()
    return Object.entries(countries).map(([_, name]) => ({
      value: getCode(name as string) || '',
      label: name as string
    })).sort((a, b) => (a.label as string).localeCompare(b.label as string))
  }, [])

  // Encontrar el objeto de país seleccionado basado en el código ISO
  const selectedCountry = useMemo(() => 
    countryOptions.find(option => option.value === value)
  , [value, countryOptions])

  const handleChange = (option: any) => {
    onChange(option ? option.value : null)
  }

  return (
    <div className={className}>
      {id && (
        <Label 
          htmlFor={id}
          className="text-sm font-medium mb-1.5 block"
        >
          País de Fabricación
        </Label>
      )}
      <Select
        id={id}
        options={countryOptions}
        value={selectedCountry}
        onChange={handleChange}
        isSearchable
        isClearable
        placeholder="Seleccionar país..."
        classNames={{
          control: (state) => 
            'flex min-h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors ' +
            (state.isFocused ? 'ring-2 ring-ring ring-offset-2' : ''),
          placeholder: () => 'text-muted-foreground',
          input: () => 'text-sm',
          option: (state) => 
            'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none ' +
            (state.isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'),
          menu: () => 'bg-popover text-popover-foreground',
        }}
      />
    </div>
  )
}
