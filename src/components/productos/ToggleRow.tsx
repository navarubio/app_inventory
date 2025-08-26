import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface ToggleRowProps {
  id: string
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function ToggleRow({ id, label, checked, onCheckedChange }: ToggleRowProps) {
  return (
    <div className="flex items-center space-x-3 py-3">
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <Label 
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </Label>
    </div>
  )
}
