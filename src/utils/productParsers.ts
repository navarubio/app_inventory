interface ParseResult {
  found: boolean
  value: string | null
}

export function parseConcentracion(nombre: string): ParseResult {
  // Busca patrones como "200MG", "2.5 G", "100 ML", "500MCG", "1000UI", "5%"
  const regex = /(\d+\.?\d*)\s*(mg|g|ml|mcg|ui|l|%)/i
  const match = nombre.match(regex)

  if (match) {
    // Normaliza el formato (ej: "200 MG")
    const cantidad = match[1]
    const unidad = match[2].toUpperCase()
    return {
      found: true,
      value: `${cantidad} ${unidad}`
    }
  }

  return {
    found: false,
    value: null
  }
}

export function parseEnvase(nombre: string): ParseResult {
  // Busca patrones como "X 30 TABLETAS", "X 100ML", "X 5 CAPSULAS"
  const regex = /x\s*(\d+\s*\w+)/i
  const match = nombre.match(regex)

  if (match) {
    // Normaliza el formato
    return {
      found: true,
      value: match[1].toUpperCase()
    }
  }

  return {
    found: false,
    value: null
  }
}
