import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"

interface AssistantButtonProps {
  onClick: () => void
  isLoading: boolean
  isDisabled: boolean
}

export function AssistantButton({ onClick, isLoading, isDisabled }: AssistantButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={isLoading || isDisabled}
      className="w-full"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="mr-2 h-4 w-4" />
      )}
      Asistente: Sugerir Información Basada en Productos Similares
    </Button>
  )
}
