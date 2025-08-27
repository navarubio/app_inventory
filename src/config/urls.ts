// Configuración de URLs para diferentes entornos
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const isProduction = window.location.hostname === '10.10.10.251'

// URLs base según el entorno
export const API_BASE_URL = isDevelopment 
  ? 'http://10.10.10.251:8890'
  : `${window.location.protocol}//${window.location.hostname}:8890`

export const MEDIA_BASE_URL = isDevelopment
  ? 'http://10.10.10.251:80'
  : `${window.location.protocol}//${window.location.hostname}`

// Función para construir URLs de imágenes correctamente
export const buildImageUrl = (imagePath: string): string => {
  // Si la ruta ya es una URL completa, devolverla tal como está
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  
  // Si la ruta comienza con /media/, construir URL completa
  if (imagePath.startsWith('/media/')) {
    return `${MEDIA_BASE_URL}${imagePath}`
  }
  
  // Si no tiene /media/, agregarla
  if (!imagePath.startsWith('/')) {
    imagePath = `/${imagePath}`
  }
  
  return `${MEDIA_BASE_URL}/media/products${imagePath}`
}

// Función para construir URLs de API
export const buildApiUrl = (endpoint: string): string => {
  // Remover / inicial si existe
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  return `${API_BASE_URL}/${cleanEndpoint}`
}

// Configuración específica para el entorno actual
export const CONFIG = {
  isDevelopment,
  isProduction,
  apiBaseUrl: API_BASE_URL,
  mediaBaseUrl: MEDIA_BASE_URL,
  
  // URLs de endpoints específicos
  endpoints: {
    products: `${API_BASE_URL}/api/products`,
    productImages: `${API_BASE_URL}/api/product-images`,
    tags: `${API_BASE_URL}/api/tags`,
    upload: `${API_BASE_URL}/api/images/upload`
  }
}

console.log('🔧 Configuración de URLs cargada:', {
  environment: isDevelopment ? 'development' : 'production',
  hostname: window.location.hostname,
  apiBaseUrl: API_BASE_URL,
  mediaBaseUrl: MEDIA_BASE_URL
})
