import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Barcode, Edit, Loader2 } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { toast } from '@/components/ui/use-toast';
import { ProductoDetalle } from '@/components/productos/ProductoDetalle';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Definir la interfaz para el producto
interface Producto {
  codigoInterno: string;
  upc: string;
  nombreProducto: string;
  presentacionOriginal: number;
  laboratorio: string;
  nivelCompletacion: number;
  categoriaOriginal: string;
  formaFarmaceutica: string | null;
  concentracionDosis: string | null;
  contenidoEnvase: string | null;
  viaAdministracion: string | null;
  poblacionDiana: string | null;
  tagsIndicaciones: string | null;
  paisFabricacion: string;
  requierePrescripcionMedica: boolean;
  esPsicotropico: boolean;
  requiereCadenaDeFrio: boolean;
  principioActivo: string;
  patologia: string;
  posologia: string;
  contraindicaciones: string;
  sustitutoSugerido: string;
  // Campos para la nueva categorización
  categoryId: number | null;
  subcategoryId: number | null;
  specific1Id: number | null;
  specific2Id: number | null;
}

// Definir la interfaz para la respuesta paginada
interface PaginatedResponse {
  content: Producto[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

export default function CategoriaProductos() {
  // Estados
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);

  // Filtros
  const [filtros, setFiltros] = useState({
    codigo: '',
    upc: '',
    nombre: '',
    laboratorio: ''
  });

  // Modificar el useEffect para la carga inicial y los filtros
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Efecto para carga inicial
  useEffect(() => {
    if (isInitialLoad) {
      cargarProductos();
      setIsInitialLoad(false);
    }
  }, []);

  // Efecto para los filtros con debounce
  useEffect(() => {
    if (!isInitialLoad) {
      const timeoutId = setTimeout(() => {
        cargarProductos();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [filtros, page, size]);

  // Función para cargar productos
  const cargarProductos = async () => {
    try {
      setLoading(true);

      // Si hay código interno o UPC, usar los endpoints específicos
      if (filtros.codigo.trim()) {
        const response = await fetch(`http://10.10.10.251:8890/api/products/codigo/${filtros.codigo.trim()}`);
        if (!response.ok) throw new Error('Error en la respuesta del servidor');
        const data = await response.json();
        
        // Asegurarnos de que los campos de categorización estén presentes
        const productoConCategorizacion = {
          ...data,
          categoryId: data.categoryId || null,
          subcategoryId: data.subcategoryId || null,
          specific1Id: data.specific1Id || null,
          specific2Id: data.specific2Id || null
        };
        
        // Convertir respuesta única a formato paginado
        setProductos([productoConCategorizacion]);
        setTotalPages(1);
        setTotalElements(1);
        setLoading(false);
        return;
      }

      if (filtros.upc.trim()) {
        const response = await fetch(`http://10.10.10.251:8890/api/products/upc/${filtros.upc.trim()}`);
        if (!response.ok) throw new Error('Error en la respuesta del servidor');
        const data = await response.json();
        
        // Asegurarnos de que los campos de categorización estén presentes
        const productoConCategorizacion = {
          ...data,
          categoryId: data.categoryId || null,
          subcategoryId: data.subcategoryId || null,
          specific1Id: data.specific1Id || null,
          specific2Id: data.specific2Id || null
        };
        
        // Convertir respuesta única a formato paginado
        setProductos([productoConCategorizacion]);
        setTotalPages(1);
        setTotalElements(1);
        setLoading(false);
        return;
      }

      // Si no hay código o UPC, usar el endpoint de búsqueda general
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });

      // Agregar solo los filtros de nombre y laboratorio
      if (filtros.nombre.trim()) {
        queryParams.append('nombre', filtros.nombre.trim());
      }
      if (filtros.laboratorio.trim()) {
        queryParams.append('laboratorio', filtros.laboratorio.trim());
      }

      const response = await fetch(`http://10.10.10.251:8890/api/products/search?${queryParams}`);
      if (!response.ok) throw new Error('Error en la respuesta del servidor');
      
      const data: PaginatedResponse = await response.json();
      
      // Asegurarnos de que todos los productos tengan los campos de categorización
      const productosConCategorizacion = data.content.map(producto => ({
        ...producto,
        categoryId: producto.categoryId || null,
        subcategoryId: producto.subcategoryId || null,
        specific1Id: producto.specific1Id || null,
        specific2Id: producto.specific2Id || null
      }));
      
      setProductos(productosConCategorizacion);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalItems);

    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Categorización de Productos">
      <div className="container mx-auto p-6">
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros de Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Código</label>
                <div className="relative">
                  <Input
                    placeholder="Código interno"
                    value={filtros.codigo}
                    onChange={(e) => setFiltros({...filtros, codigo: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Código de Barras</label>
                <div className="relative">
                  <Input
                    placeholder="UPC/EAN"
                    value={filtros.upc}
                    onChange={(e) => setFiltros({...filtros, upc: e.target.value})}
                  />
                  <Barcode className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <Input
                  placeholder="Buscar por nombre"
                  value={filtros.nombre}
                  onChange={(e) => setFiltros({...filtros, nombre: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Laboratorio</label>
                <Input
                  placeholder="Filtrar por laboratorio"
                  value={filtros.laboratorio}
                  onChange={(e) => setFiltros({...filtros, laboratorio: e.target.value})}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={cargarProductos}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Search className="mr-2 h-4 w-4" /> Buscar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de productos */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Catálogo de Productos</CardTitle>
              <div className="text-sm text-gray-500">
                Mostrando {productos.length} de {totalElements} registros
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0"> {/* Eliminamos el padding */}
            <div className="overflow-x-auto max-h-[600px]"> {/* Contenedor con scroll */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="bg-green-600 text-white sticky top-0">Código</TableHead>
                    <TableHead className="bg-green-600 text-white sticky top-0">Código de Barras</TableHead>
                    <TableHead className="bg-green-600 text-white sticky top-0">Descripción</TableHead>
                    <TableHead className="bg-green-600 text-white sticky top-0">Presentación</TableHead>
                    <TableHead className="bg-green-600 text-white sticky top-0">Laboratorio</TableHead>
                    <TableHead className="bg-green-600 text-white sticky top-0 text-center">Completado</TableHead>
                    <TableHead className="bg-green-600 text-white sticky top-0 text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 rounded-full mx-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : productos.length > 0 ? (
                    productos.map((producto) => (
                      <TableRow key={producto.codigoInterno} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{producto.codigoInterno}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Barcode className="h-4 w-4 text-gray-400" />
                            <span>{producto.upc}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">{producto.nombreProducto}</TableCell>
                        <TableCell>{producto.presentacionOriginal}</TableCell>
                        <TableCell>{producto.laboratorio}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <div 
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                                ${producto.nivelCompletacion < 30 ? 'bg-red-100 text-red-600' :
                                  producto.nivelCompletacion < 70 ? 'bg-yellow-100 text-yellow-600' :
                                  'bg-green-100 text-green-600'}`}
                            >
                              {producto.nivelCompletacion}%
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProducto(producto);
                              setIsDetalleOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No se encontraron productos que coincidan con los filtros
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-end px-4 pb-4"> {/* Añadido justify-end */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(0)}
                disabled={page === 0}
              >
                Primera
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(prev => Math.max(0, prev - 1))}
                disabled={page === 0}
              >
                Anterior
              </Button>
              <span className="mx-4 text-sm text-gray-600">
                Página {page + 1} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={page === totalPages - 1}
              >
                Siguiente
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(totalPages - 1)}
                disabled={page === totalPages - 1}
              >
                Última
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Loader global */}
      {loading && (
        <div className="fixed inset-0 bg-black/5 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Cargando...</span>
          </div>
        </div>
      )}

      {/* Modal de Detalle del Producto */}
      {selectedProducto && (
        <ProductoDetalle
          open={isDetalleOpen}
          onOpenChange={setIsDetalleOpen}
          producto={selectedProducto}
        />
      )}
    </AppLayout>
  );
}