import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import debounce from 'lodash/debounce'

// URL base del servidor (debe coincidir con la configuración del componente principal)
const SERVER_URL = 'http://10.10.10.251';

interface ProductSuggestion {
  codigoInterno: string
  nombreProducto: string
  presentacionOriginal: number
  laboratorio: string
  categoryId: number | null
  subcategoryId: number | null
  specific1Id: number | null
  specific2Id: number | null
  categoriaPrincipal?: string
  subcategoria1?: string
  subcategoria2?: string
  subcategoria3?: string
}

interface CloneCategorizationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProductSelect: (categorization: {
    categoryId: number | null
    subcategoryId: number | null
    specific1Id: number | null
    specific2Id: number | null
  }) => void
}

export function CloneCategorization({
  open,
  onOpenChange,
  onProductSelect
}: CloneCategorizationProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([])
  const [loading, setLoading] = useState(false)

  // Resetear estado cuando se abre/cierra el modal
  useEffect(() => {
    if (!open) {
      // Limpiar estado cuando se cierra el modal
      setSearchTerm('')
      setSuggestions([])
    } else {
      // Cargar productos cuando se abre el modal
      fetchSuggestions('')
    }
  }, [open])

  // Manejar el cierre del modal
  const handleClose = () => {
    onOpenChange(false)
    setSearchTerm('')
    setSuggestions([])
  }

  const fetchSuggestions = async (term: string) => {
    console.log('Buscando término:', term);
    
    // Si el término está vacío, mostrar todos los productos categorizados
    const url = term 
      ? `${SERVER_URL}:8890/api/products/categorized?nombre=${encodeURIComponent(term)}&page=0&size=20`
      : `${SERVER_URL}:8890/api/products/categorized?page=0&size=20`;
    
    console.log('URL de búsqueda:', url);
    setLoading(true)

    try {
      const response = await fetch(url);
      console.log('Estado de la respuesta:', response.status);
      
      if (!response.ok) {
        throw new Error(`Error en la búsqueda: ${response.status}`);
      }

      const data = await response.json();
      console.log('Respuesta completa:', data);

      if (data && Array.isArray(data.content)) {
        console.log(`Se encontraron ${data.content.length} productos`);
        setSuggestions(data.content);
      } else {
        console.log('No se encontraron productos o formato inválido:', data);
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error buscando productos:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  // Debounce la función de búsqueda
  const debouncedFetch = debounce(fetchSuggestions, 300)

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    debouncedFetch(value)
  }

  const handleProductSelect = (product: ProductSuggestion) => {
    console.log('Seleccionando categorización de producto:', product.codigoInterno)
    onProductSelect({
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      specific1Id: product.specific1Id,
      specific2Id: product.specific2Id
    })
    handleClose() // Usar handleClose en lugar de onOpenChange
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px]" onInteractOutside={handleClose} onEscapeKeyDown={handleClose}>
        <DialogHeader>
          <DialogTitle>Copiar categorización de otro producto</DialogTitle>
          <DialogDescription>
            Busque un producto ya categorizado para copiar su clasificación
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Input
              placeholder="Buscar por nombre, código o categoría..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full"
              autoFocus
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full" />
              </div>
            )}
          </div>

          <ScrollArea className="h-[300px] w-full rounded-md border">
            <div className="p-1">
              {suggestions.map((product) => (
                <Button
                  key={product.codigoInterno}
                  variant="ghost"
                  className="w-full justify-start text-left p-3 hover:bg-accent mb-1 block"
                  onClick={() => handleProductSelect(product)}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <span className="font-medium line-clamp-2">{product.nombreProducto}</span>
                      <Badge variant="outline" className="ml-2 shrink-0">
                        {product.codigoInterno}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">{product.laboratorio}</span>
                      {product.presentacionOriginal && (
                        <span>• {product.presentacionOriginal} unid.</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted/50 p-1 rounded">
                      {[
                        product.categoriaPrincipal,
                        product.subcategoria1,
                        product.subcategoria2,
                        product.subcategoria3
                      ]
                        .filter(Boolean)
                        .join(' > ')}
                    </div>
                  </div>
                </Button>
              ))}
              {!loading && suggestions.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">
                  {searchTerm 
                    ? "No se encontraron productos categorizados con ese criterio"
                    : "Mostrando todos los productos categorizados..."}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
