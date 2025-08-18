import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, FileDown, Eye, X, FileText, ArrowRight, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

// Interfaces (sin cambios)
interface Producto {
  codigo: string;
  codigoBarra: string;
  descripcionProducto: string;
  presentacion: number;
  categoriaName: string;
  reference: string;
  laboratorio: string;
  costoCompra: number;
  pvp: number;
  gravamen: string;
}

interface KardexEntry {
  fechaHora: string;
  codLocal: string;
  nombreLocation: string;
  idProduct: string;
  nombreProducto: string;
  presentacion: number;
  tipodocumento: string;
  documento: string;
  saldoAnterior: number;
  unidadesMovidas: number;
  saldoAcumulado: number;
  operador: string;
  costoPromedio: number;
  totalCosto: number;
  clienteProveedorOrigenDestino: string;
}

export default function KardexGeneral() {
  // Estados para la tabla de productos
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filtros de productos
  const [filtros, setFiltros] = useState({
    codigo: '',
    descripcion: '',
    laboratorio: ''
  });

  // Estados para el detalle del kardex
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [kardexEntries, setKardexEntries] = useState<KardexEntry[]>([]);
  const [kardexLoading, setKardexLoading] = useState(false);
  const [kardexPage, setKardexPage] = useState(0);
  const [kardexTotalPages, setKardexTotalPages] = useState(0);
  const [showKardexModal, setShowKardexModal] = useState(false);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);

  // Nuevo estado para el loading de la exportación
  const [exportLoading, setExportLoading] = useState(false);

  // Filtros de kardex
  const [kardexFilters, setKardexFilters] = useState({
    fechaDesde: null as Date | null,
    fechaHasta: null as Date | null,
    tipodocumento: '',
    codLocal: '',
    nombreLocation: ''
  });

  // Efecto para cargar productos
  useEffect(() => {
    cargarProductos();
  }, [page, size, filtros]);

  // Función para cargar productos
  const cargarProductos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        ...(filtros.codigo && { codigo: filtros.codigo }),
        ...(filtros.descripcion && { descripcion: filtros.descripcion }),
        ...(filtros.laboratorio && { laboratorio: filtros.laboratorio })
      });

      const response = await fetch(`http://10.10.10.251:8890/api/products-by-kardex?${params}`);
      const data = await response.json();

      setProductos(data.data);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar el detalle del kardex inicial (página 0)
  const cargarKardex = async (producto: Producto) => {
    try {
      setShowLoadingAnimation(true);
      setKardexLoading(true);

      setSelectedProduct(producto);

      setKardexFilters({
        fechaDesde: null,
        fechaHasta: null,
        tipodocumento: '',
        codLocal: '',
        nombreLocation: ''
      });
      setKardexPage(0);

      const params = new URLSearchParams({
        page: '0',
        size: '50'
      });

      const response = await fetch(
        `http://10.10.10.251:8890/api/kardex/${producto.codigo}?${params}`
      );

      if (!response.ok) {
         const errorData = await response.text().catch(() => response.statusText);
         throw new Error(`HTTP error! status: ${response.status} - ${errorData}`);
      }

      const data = await response.json();

      setKardexEntries(Array.isArray(data.data) ? data.data : []);
      setKardexTotalPages(data.totalPages || 0);

      setShowKardexModal(true);

    } catch (error) {
      console.error('Error al cargar el kardex:', error);
      setKardexEntries([]);
      setKardexTotalPages(0);
      setKardexPage(0);
    } finally {
      setKardexLoading(false);
      setShowLoadingAnimation(false);
    }
  };

  // Función para cerrar el modal del kardex
  const handleCloseKardexModal = () => {
    setShowKardexModal(false);
    setKardexEntries([]);
    setKardexPage(0);
    setKardexTotalPages(0);
    setSelectedProduct(null);
    setShowLoadingAnimation(false);
    setKardexLoading(false);
    setExportLoading(false);
  };

  // Función para aplicar filtros O navegar por páginas en el kardex (visualización en modal)
  const fetchKardexPage = async (targetPage: number) => {
      if (!selectedProduct) {
          console.error("No product selected to fetch kardex page.");
          return;
      }

      try {
          setKardexLoading(true);
          setShowLoadingAnimation(true);

          const params = new URLSearchParams({
              page: targetPage.toString(),
              size: '50'
          });

          if (kardexFilters.fechaDesde) {
              const fechaDesde = format(kardexFilters.fechaDesde, 'dd/MM/yyyy');
              params.append('fechaDesde', fechaDesde);
          }
          if (kardexFilters.fechaHasta) {
              const fechaHasta = format(kardexFilters.fechaHasta, 'dd/MM/yyyy');
              params.append('fechaHasta', fechaHasta);
          }
          if (kardexFilters.tipodocumento) {
              params.append('tipodocumento', kardexFilters.tipodocumento);
          }
          if (kardexFilters.codLocal) {
              // CORRECCIÓN DEL TYPO
              params.append('codLocal', kardexFilters.codLocal);
          }
           if (kardexFilters.nombreLocation) {
               params.append('nombreLocation', kardexFilters.nombreLocation);
           }

          const response = await fetch(
              `http://10.10.10.251:8890/api/kardex/${selectedProduct.codigo}?${params}`
          );

          if (!response.ok) {
               const errorData = await response.text().catch(() => response.statusText);
               throw new Error(`HTTP error! status: ${response.status} - ${errorData}`);
          }

          const data = await response.json();

          setKardexEntries(Array.isArray(data.data) ? data.data : []);
          setKardexTotalPages(data.totalPages || 0);
          setKardexPage(targetPage);

      } catch (error) {
          console.error('Error al cargar el kardex:', error);
          setKardexEntries([]);
          setKardexTotalPages(0);
          setKardexPage(0);
      } finally {
          setKardexLoading(false);
          setShowLoadingAnimation(false);
      }
  };

  // Manejador para aplicar filtros desde el modal
  const handleApplyKardexFilters = () => {
      fetchKardexPage(0);
  };

  // Función para exportar productos a Excel (sin cambios)
  const exportToExcel = () => {
    const dataToExport = productos.map(item => ({
      'Código': item.codigo,
      'Código de Barras': item.codigoBarra,
      'Descripción': item.descripcionProducto,
      'Presentación': item.presentacion,
      'Categoría': item.categoriaName,
      'Referencia': item.reference,
      'Laboratorio': item.laboratorio,
      'Costo': item.costoCompra?.toFixed(2) || 'N/A',
      'PVP': item.pvp?.toFixed(2) || 'N/A',
      'Gravamen': item.gravamen
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kardex General Productos');

    const wscols = [
      { wch: 10 }, { wch: 20 }, { wch: 40 },
      { wch: 12 }, { wch: 15 }, { wch: 15 },
      { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 15 }
    ];
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, `kardex_general_productos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Función para exportar *todos* los movimientos del kardex a Excel (Formato exacto de la imagen)
  const exportAllKardexToExcel = async () => {
    if (!selectedProduct) {
      console.warn("No product selected for export.");
      return;
    }

    try {
      setExportLoading(true);
      setShowLoadingAnimation(true);

      // Construir parámetros incluyendo filtros y solicitando un tamaño grande
      const params = new URLSearchParams({
        page: '0',
        size: '100000' // Tamaño grande
      });

      // Añadir filtros actuales
      if (kardexFilters.fechaDesde) {
        const fechaDesde = format(kardexFilters.fechaDesde, 'dd/MM/yyyy');
        params.append('fechaDesde', fechaDesde);
      }
      if (kardexFilters.fechaHasta) {
        const fechaHasta = format(kardexFilters.fechaHasta, 'dd/MM/yyyy');
        params.append('fechaHasta', fechaHasta);
      }
      if (kardexFilters.tipodocumento) {
        params.append('tipodocumento', kardexFilters.tipodocumento);
      }
      if (kardexFilters.codLocal) {
        params.append('codLocal', kardexFilters.codLocal);
      }
      if (kardexFilters.nombreLocation) {
        params.append('nombreLocation', kardexFilters.nombreLocation);
      }

      const response = await fetch(
        `http://10.10.10.251:8890/api/kardex/${selectedProduct.codigo}?${params}`
      );

       if (!response.ok) {
           const errorData = await response.text().catch(() => response.statusText);
           throw new Error(`HTTP error! status: ${response.status} - ${errorData}`);
        }

      const data = await response.json();

      const allKardexEntries = Array.isArray(data.data) ? data.data : [];

      if (allKardexEntries.length === 0) {
          console.warn("No movements found to export with applied filters.");
          alert("No se encontraron movimientos para exportar con los filtros aplicados.");
          return;
      }

      // Preparar datos para Excel - Incluyendo todos los campos del KardexEntry
      // Nota: Esto mapea CADA objeto entry a un objeto con las claves exactas para los encabezados.
      // sheet_add_json con skipHeader: false usará estas claves como encabezados.
      const dataToExport = allKardexEntries.map(item => ({
        'Fecha/Hora': item.fechaHora,
        'Código Local': item.codLocal,
        'Local': item.nombreLocation,
        'Documento': `${item.tipodocumento} ${item.documento}`,
        'Saldo Anterior': item.saldoAnterior,
        'Movimiento': item.unidadesMovidas,
        'Saldo Actual': item.saldoAcumulado,
        'Operador': item.operador,
        'Costo Promedio': item.costoPromedio?.toFixed(4) || 'N/A', // Incluido en el export
        'Total Costo': item.totalCosto?.toFixed(4) || 'N/A',     // Incluido en el export
        'Origen/Destino': item.clienteProveedorOrigenDestino
      }));

      const ws = XLSX.utils.book_new().Sheets.Sheet1 || {}; // Crear hoja si no existe
      XLSX.utils.book_append_sheet(XLSX.utils.book_new(), ws, 'Kardex Completo'); // Crear workbook y añadir hoja

      // Añadir filas de encabezado con info del producto (Filas 1 y 2)
      const headerInfo = [
        [`Kardex Producto: ${selectedProduct.descripcionProducto} (Código: ${selectedProduct.codigo})`],
        [`Presentación: ${selectedProduct.presentacion} | Laboratorio: ${selectedProduct.laboratorio}`],
      ];
      XLSX.utils.sheet_add_aoa(ws, headerInfo, { origin: 'A1' });

      // Añadir fila vacía (Fila 3)
       XLSX.utils.sheet_add_aoa(ws, [[]], { origin: 'A3' });

      // Añadir los datos de los movimientos, incluyendo los encabezados (Desde Fila 4)
      // skipHeader: false --> incluye los encabezados derivados de las claves de dataToExport
      // origin: 'A4' --> empieza a escribir desde A4
      // Esto pondrá los encabezados en la Fila 4 y los datos desde la Fila 5, tal como la imagen.
      XLSX.utils.sheet_add_json(ws, dataToExport, { origin: 'A4', skipHeader: false });


      // Crear el workbook final y añadir la hoja
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Kardex Completo');


      // Configurar anchos de columna (aproximados, ajustar si es necesario)
       const wscols = [
         { wch: 18 }, // Fecha/Hora
         { wch: 12 }, // Código Local
         { wch: 25 }, // Local
         { wch: 20 }, // Documento
         { wch: 15 }, // Saldo Anterior
         { wch: 12 }, // Movimiento
         { wch: 15 }, // Saldo Actual
         { wch: 20 }, // Operador
         { wch: 15 }, // Costo Promedio (incluido en export)
         { wch: 15 }, // Total Costo (incluido en export)
         { wch: 25 }  // Origen/Destino
       ];
       ws['!cols'] = wscols;


      // Nombre del archivo: usar código y descripción del producto
      // Limpiar caracteres inválidos para nombres de archivo
      const productNameClean = selectedProduct.descripcionProducto.replace(/[\/\\:*?"<>|]/g, '_').replace(/\s+/g, '_');
      const filename = `kardex_${selectedProduct.codigo}_${productNameClean}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;


      XLSX.writeFile(wb, filename);

    } catch (error) {
      console.error('Error al exportar el kardex completo:', error);
      alert("Error al exportar el kardex. Por favor, inténtelo de nuevo.");
    } finally {
      setExportLoading(false);
      setShowLoadingAnimation(false);
    }
  };


  return (
    <div className="container mx-auto p-6">
      {/* Animación de carga */}
      {(showLoadingAnimation || exportLoading) && ( // Mostrar animación si se carga kardex O se exporta
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <div className="animate-bounce mb-4">
              <svg
                className="w-16 h-16 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            {/* Mensaje dinámico */}
            <p className="text-lg font-medium text-gray-700">{exportLoading ? 'Preparando exportación...' : 'Cargando kardex...'}</p>
          </div>
        </div>
      )}

      {/* Filtros de Productos */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros de Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código</label>
              <Input
                placeholder="Código"
                value={filtros.codigo}
                onChange={(e) => setFiltros({...filtros, codigo: e.target.value})}
                className="w-24"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <Input
                placeholder="Buscar por descripción"
                value={filtros.descripcion}
                onChange={(e) => setFiltros({...filtros, descripcion: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Laboratorio</label>
              <Input
                placeholder="Filtrar por laboratorio"
                value={filtros.laboratorio}
                onChange={(e) => setFiltros({...filtros, laboratorio: e.target.value})} // Corregido: setFfiltros -> setFiltros
              />
            </div>
            <div className="flex items-end space-x-2">
              <Button
                onClick={cargarProductos}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Search className="mr-2 h-4 w-4" /> Buscar Productos
              </Button>
              <Button
                onClick={exportToExcel} // Este botón exporta la tabla de PRODUCTOS, no el kardex
                className="bg-green-600 hover:bg-green-700"
              >
                <FileDown className="mr-2 h-4 w-4" /> Excel Productos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de productos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Productos con Kardex</CardTitle>
            <div className="text-sm text-gray-500">
              Mostrando {productos.length} de {totalElements} registros
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="table-container overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 bg-white min-w-[100px]">Código</TableHead>
                  <TableHead className="min-w-[200px]">Descripción</TableHead>
                  <TableHead className="min-w-[100px]">Presentación</TableHead>
                  <TableHead className="min-w-[150px]">Laboratorio</TableHead>
                  <TableHead className="text-right min-w-[100px]">Costo</TableHead>
                  <TableHead className="text-right min-w-[100px]">PVP</TableHead>
                  <TableHead className="min-w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={`skeleton-products-${i}`}>
                      <TableCell className="sticky left-0 z-10 bg-white"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                    </TableRow>
                  ))
                ) : productos.length > 0 ? (
                  productos.map((producto) => (
                    <TableRow key={producto.codigo}>
                      <TableCell className="font-medium sticky left-0 z-10 bg-white">{producto.codigo}</TableCell>
                      <TableCell>{producto.descripcionProducto}</TableCell>
                      <TableCell>{producto.presentacion}</TableCell>
                      <TableCell>{producto.laboratorio}</TableCell>
                      <TableCell className="text-right">${producto.costoCompra?.toFixed(2) || 'N/A'}</TableCell>
                      <TableCell className="text-right">${producto.pvp?.toFixed(2) || 'N/A'}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cargarKardex(producto)}
                          disabled={loading || showLoadingAnimation || kardexLoading || exportLoading}
                        >
                          <Eye className="h-4 w-4" />
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

          {/* Paginación de productos */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Página {page + 1} de {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(0)}
                  disabled={page === 0 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="ml-2">Primera</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0 || loading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1 || loading}
                >
                  Siguiente
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(totalPages - 1)}
                  disabled={page >= totalPages - 1 || loading}
                >
                  <span className="mr-2">Última</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalle del kardex */}
      {showKardexModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">
                  Kardex: {selectedProduct.descripcionProducto}
                </h3>
                <div className="text-sm text-gray-600">
                  Código: {selectedProduct.codigo} |
                  Presentación: {selectedProduct.presentacion} |
                  Laboratorio: {selectedProduct.laboratorio}
                </div>
              </div>
              <div className="flex space-x-2">
                 <Button
                    onClick={exportAllKardexToExcel} // Llama a la función de exportación completa
                    className="bg-green-600 hover:bg-green-700"
                    disabled={kardexLoading || exportLoading}
                 >
                    {exportLoading ? (
                       <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Exportando...
                       </div>
                    ) : (
                        <> <FileDown className="mr-2 h-4 w-4" /> Exportar a Excel (Completo) </>
                    )}
                 </Button>
                <Button
                  variant="destructive"
                  onClick={handleCloseKardexModal}
                  className="bg-red-600 hover:bg-red-700 text-white"
                   disabled={exportLoading}
                >
                  <X className="mr-2 h-4 w-4" /> Cerrar
                </Button>
              </div>
            </div>

            {/* Filtros del kardex */}
            <div className="p-4 border-b">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Rango de fechas</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !kardexFilters.fechaDesde && "text-muted-foreground"
                        )}
                         disabled={kardexLoading || exportLoading}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {kardexFilters.fechaDesde ? (
                          kardexFilters.fechaHasta ? (
                            <>
                              {format(kardexFilters.fechaDesde, "PPP", { locale: es })} -{" "}
                              {format(kardexFilters.fechaHasta, "PPP", { locale: es })}
                            </>
                          ) : (
                            format(kardexFilters.fechaDesde, "PPP", { locale: es })
                          )
                        ) : (
                          <span>Seleccionar fechas</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={kardexFilters.fechaDesde || new Date()}
                        selected={{
                          from: kardexFilters.fechaDesde || undefined,
                          to: kardexFilters.fechaHasta || undefined
                        }}
                        onSelect={(range: DateRange | undefined) => {
                          setKardexFilters({
                            ...kardexFilters,
                            fechaDesde: range?.from || null,
                            fechaHasta: range?.to || null
                          });
                        }}
                        numberOfMonths={2}
                        locale={es}
                        disabled={kardexLoading || exportLoading}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de documento</label>
                  <Input
                    placeholder="Filtrar por tipo"
                    value={kardexFilters.tipodocumento}
                    onChange={(e) => setKardexFilters({
                      ...kardexFilters,
                      tipodocumento: e.target.value
                    })}
                    disabled={kardexLoading || exportLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Código local</label>
                  <Input
                    placeholder="Filtrar por código"
                    value={kardexFilters.codLocal}
                    onChange={(e) => setKardexFilters({
                      ...kardexFilters,
                      codLocal: e.target.value
                    })}
                    disabled={kardexLoading || exportLoading}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    className="w-full"
                    onClick={handleApplyKardexFilters}
                    disabled={kardexLoading || exportLoading}
                  >
                    {kardexLoading ? (
                      <div className="flex items-center justify-center">
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                         Aplicando...
                      </div>
                    ) : (
                       <> <Search className="mr-2 h-4 w-4" /> Aplicar Filtros </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabla de kardex */}
            <div className="flex-1 overflow-auto p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* Headers sin Costo Promedio ni Total Costo */}
                    <TableHead className="w-32 min-w-[120px]">Fecha/Hora</TableHead>
                    <TableHead className="w-24 min-w-[80px]">Código Local</TableHead>
                    <TableHead className="w-40 min-w-[150px]">Local</TableHead>
                    <TableHead className="w-25 min-w-[100px]">Documento</TableHead>
                    <TableHead className="w-25 text-right min-w-[100px]">Saldo Anterior</TableHead>
                    <TableHead className="w-25 text-right font-bold min-w-[100px]">Movimiento</TableHead>
                    <TableHead className="w-25 text-right min-w-[100px]">Saldo Actual</TableHead>
                    <TableHead className="min-w-[150px]">Operador</TableHead>
                    {/* Se elimina Costo Promedio y Total Costo del DISPLAY en la tabla */}
                    <TableHead className="w-40 min-w-[150px]">Origen/Destino</TableHead> {/* Mantener esta columna */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kardexLoading ? (
                    <TableRow>
                      {/* Colspan ajustado a 9 */}
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                        <p className="mt-2 text-gray-700">Cargando movimientos...</p>
                      </TableCell>
                    </TableRow>
                  ) : kardexEntries.length > 0 ? (
                    kardexEntries.map((entry, index) => (
                      <TableRow key={`${entry.fechaHora}-${index}`}>
                        <TableCell className="whitespace-nowrap">{entry.fechaHora}</TableCell>
                        <TableCell className="whitespace-nowrap">{entry.codLocal}</TableCell>
                        <TableCell className="whitespace-nowrap">{entry.nombreLocation}</TableCell>
                        <TableCell className="whitespace-nowrap">{entry.tipodocumento} {entry.documento}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">{entry.saldoAnterior}</TableCell>
                        <TableCell
                          className={`text-right font-bold whitespace-nowrap ${
                            entry.unidadesMovidas > 0 ? 'text-green-600' :
                            entry.unidadesMovidas < 0 ? 'text-red-600' : ''
                          }`}
                        >
                          {entry.unidadesMovidas > 0 ? '+' : ''}{entry.unidadesMovidas}
                        </TableCell>
                        <TableCell className="text-right font-medium whitespace-nowrap">
                          {entry.saldoAcumulado}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{entry.operador}</TableCell>
                         {/* Se elimina Costo Promedio y Total Costo del DISPLAY en la tabla */}
                         <TableCell className="whitespace-nowrap">{entry.clienteProveedorOrigenDestino}</TableCell> {/* Mantener esta celda */}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                       {/* Colspan ajustado a 9 */}
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        No se encontraron movimientos para este producto con los filtros aplicados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginación del kardex */}
            {kardexTotalPages > 1 && (
              <div className="p-4 border-t flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Página {kardexPage + 1} de {kardexTotalPages}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchKardexPage(0)}
                    disabled={kardexPage === 0 || kardexLoading || exportLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="ml-2">Primera</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchKardexPage(kardexPage - 1)}
                    disabled={kardexPage === 0 || kardexLoading || exportLoading}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchKardexPage(kardexPage + 1)}
                    disabled={kardexPage >= kardexTotalPages - 1 || kardexLoading || exportLoading}
                  >
                    Siguiente
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchKardexPage(kardexTotalPages - 1)}
                    disabled={kardexPage >= kardexTotalPages - 1 || kardexLoading || exportLoading}
                  >
                    <span className="mr-2">Última</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}