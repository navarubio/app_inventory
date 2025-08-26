import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { InputHTMLAttributes } from "react"

interface SuggestionInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onSuggest: () => void
  className?: string
}

export function SuggestionInput({ onSuggest, className, ...props }: SuggestionInputProps) {
  return (
    <div className="relative flex w-full">
      <Input className={className} {...props} />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2"
        onClick={onSuggest}
      >
        <Sparkles className="h-4 w-4" />
      </Button>
    </div>
  )
}
