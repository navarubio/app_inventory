import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft, Download, Mail, Truck, Trash } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as XLSX from 'xlsx';
//import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface Despacho {
  ticketid: number;
  fechaCalculoPedido: string;
  localSalida: string;
  localDestino: string;
  estadoFaseDespacho: string;
}

interface DetalleDespacho {
  ticketsbuyUuidAsociado: string;
  fechaCalculoFormato: string;
  ticketid: number;
  codigoLocal: string;
  nombreLocal: string;
  productoId: string;
  nombreProducto: string;
  nombreLaboratorio: string;
  cantidadOptimaRequerida: number;
  cantidadDespachaBodega: number;
  cantidadFaltante: number;
  stockBodegaMomentoCalculo: number;
  stockLocalMomentoCalculo: number;
  wmaDemandaPacks: number;
  estadoRegistro: string;
  factoresCalculoAplicados: string;
  precioCompraPorUnidadBase: number;
  presentacion: number;
  referenciasUltimasCompras: string;
  totalCosto?: number;
}

const AnalizarDespachos = () => {
  const { toast } = useToast();
  const [despachos, setDespachos] = useState<Despacho[]>([]);
  const [detalleDespacho, setDetalleDespacho] = useState<DetalleDespacho[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    codigo: '',
    producto: '',
    laboratorio: '',
    faltante: 'todos',
    estado: 'todos'
  });
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});
  const [editedCostos, setEditedCostos] = useState<Record<string, number>>({});
  const [deletedRows, setDeletedRows] = useState<string[]>([]);

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Modificar el filteredDetalleDespacho en useMemo
  const filteredDetalleDespacho = useMemo(() => {
    return detalleDespacho
      .filter(item => !deletedRows.includes(item.productoId)) // Filtrar primero los eliminados
      .filter(item => {
        return (
          (filters.codigo === '' || item.productoId.toLowerCase().includes(filters.codigo.toLowerCase())) &&
          (filters.producto === '' || item.nombreProducto.toLowerCase().includes(filters.producto.toLowerCase())) &&
          (filters.laboratorio === '' || item.nombreLaboratorio.toLowerCase().includes(filters.laboratorio.toLowerCase())) &&
          (filters.faltante === 'todos' || (filters.faltante === 'mayor_cero' && item.cantidadFaltante > 0)) &&
          (filters.estado === 'todos' || item.estadoRegistro === filters.estado)
        );
      });
  }, [detalleDespacho, filters, deletedRows]); // Agregar deletedRows como dependencia

  useEffect(() => {
    const fetchDespachos = async () => {
      try {
        const response = await fetch('http://10.10.10.251:8890/api/pedidos-despachados');
        if (!response.ok) {
          throw new Error('Error al cargar los despachos');
        }
        const data = await response.json();
        setDespachos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDespachos();
  }, []);

  useEffect(() => {
    if (detalleDespacho.length > 0) {
      const initialValues = detalleDespacho.reduce((acc, item) => {
        acc[item.productoId] = item.cantidadFaltante;
        return acc;
      }, {} as Record<string, number>);
      setEditedValues(initialValues);
    }
  }, [detalleDespacho]);

  const fetchDetalleDespacho = async (ticketId: number) => {
    try {
      setSelectedTicket(ticketId);

      setIsLoadingDetail(true);
      setDetalleDespacho([]); 
      setError(null);

      const response = await fetch(`http://10.10.10.251:8890/api/detalle-pedido-optimus/ticketid/${ticketId}`);
      if (!response.ok) {
        throw new Error('Error al cargar el detalle del despacho');
      }

      const data = await response.json();
      setDetalleDespacho(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setIsLoadingDetail(false);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleBackToList = () => {
    setSelectedTicket(null);
    setDetalleDespacho([]);
  };

  const exportToExcel = () => {
    try {
      // Obtener el laboratorio del primer item de la lista filtrada
      const primerLaboratorio = filteredDetalleDespacho[0]?.nombreLaboratorio || 'General';
      // Limpiar el nombre del laboratorio para el nombre del archivo
      const laboratorioParaNombre = primerLaboratorio
        .replace(/[\/\\?%*:|"<>]/g, '-') // Reemplazar caracteres no válidos
        .trim(); // Eliminar espacios al inicio y final

      const dataToExport = filteredDetalleDespacho
        .filter(item => !deletedRows.includes(item.productoId))
        .map(item => ({
          'Código': item.productoId,
          'Producto': item.nombreProducto,
          'Presentación': item.presentacion,
          'Laboratorio': item.nombreLaboratorio,
          'Requerido': item.cantidadOptimaRequerida,
          'Despachado': item.cantidadDespachaBodega,
          'Faltante': editedValues[item.productoId] ?? item.cantidadFaltante,
          'Últ. Costo': (editedCostos[item.productoId] ?? item.precioCompraPorUnidadBase)?.toFixed(2).replace('.', ','),
          'Total Costo': calculateTotalCosto(
            editedValues[item.productoId] ?? item.cantidadFaltante,
            editedCostos[item.productoId] ?? item.precioCompraPorUnidadBase
          ).toFixed(2).replace('.', ','),
          'WMA': item.wmaDemandaPacks.toFixed(1),
          'Stock Bodega': item.stockBodegaMomentoCalculo,
          'Stock Local': item.stockLocalMomentoCalculo,
          'Estado': item.estadoRegistro,
          'Referencias': formatReferencias(item.referenciasUltimasCompras)
        }));
  
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      
      // Configurar formato de números para la columna Últ. Costo
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const ultCostoCol = 7; // Índice de la columna 'Últ. Costo'
      for (let row = range.s.r + 1; row <= range.e.r; row++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: ultCostoCol });
        if (worksheet[cellRef]) {
          worksheet[cellRef].z = '#,##0.00';
        }
      }

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'DetalleDespacho');
      
      // Usar el nombre del laboratorio en el nombre del archivo
      const fileName = `despacho_${selectedTicket}_${laboratorioParaNombre}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Éxito",
        description: "Archivo Excel generado correctamente",
        variant: "default" // o "success" si tu implementación de toast tiene ese variant
      });
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      toast({
        title: "Error",
        description: "Error al generar el archivo Excel",
        variant: "destructive" // o "error" si tu implementación de toast tiene ese variant
      });
    }
  };

  const handleSendEmail = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Por favor ingrese un correo electrónico válido",
        variant: "destructive"
      });
      return;
    }

    if (filteredDetalleDespacho.length === 0) {
      toast({
        title: "Error",
        description: "No hay datos para enviar",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    
    try {
      const localCode = detalleDespacho[0]?.codigoLocal || '??';
      const localName = detalleDespacho[0]?.nombreLocal || 'Local';
      
      const emailContent = {
        to: email,
        subject: `Pedido Detallado Vegfarm para el local / ${localCode} - ${localName}`,
        message: `
          <p>Estimado Proveedor,</p>
          <p>Aquí está el detalle de su pedido para el local: ${localCode} - ${localName}</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <thead>
              <tr style="background-color: #1e40af; color: white;">
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Producto</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Presentación</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Laboratorio</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Optimo</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Solicitado</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Últ. Costo</th>
              </tr>
            </thead>
            <tbody>
              ${filteredDetalleDespacho.map(item => {
                const faltante = editedValues[item.productoId] ?? item.cantidadFaltante;
                return `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${item.nombreProducto}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${item.presentacion}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${item.nombreLaboratorio}</td>
                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${item.cantidadOptimaRequerida}</td>
                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd; color: ${faltante > 0 ? 'red' : 'inherit'};">
                      <strong>${faltante}</strong>
                    </td>
                    <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${item.precioCompraPorUnidadBase?.toFixed(2) || '0.00'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <p>Gracias por atender nuestros requerimientos.</p>
        `
      };

      const response = await fetch('http://10.10.10.251:3001/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailContent)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al enviar el correo');
      }

      if (data.success) {
        toast({
          title: "¡Éxito!",
          description: "El correo se ha enviado correctamente",
          variant: "default"
        });
        setEmailDialogOpen(false);
      } else {
        throw new Error(data.message || 'Error al enviar el correo');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al enviar el correo',
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatReferencias = (referenciasJson: string) => {
    try {
      const referencias = JSON.parse(referenciasJson);
      return Array.isArray(referencias) 
        ? referencias.join(' | ') 
        : 'Sin referencias';
    } catch (e) {
      return 'Error al cargar referencias';
    }
  };
  const handleEditFaltante = (productoId: string, value: number) => {
    setEditedValues(prev => ({
      ...prev,
      [productoId]: Math.max(0, value) // Asegurar que no sea negativo
    }));
  };

  // Después de los estados existentes
  const calculateTotalCosto = (faltante: number, ultimoCosto: number) => {
    return Number((faltante * ultimoCosto).toFixed(2));
  };

  const getTotalGeneral = () => {
    return filteredDetalleDespacho
      .filter(item => !deletedRows.includes(item.productoId))
      .reduce((total, item) => {
        const faltante = editedValues[item.productoId] ?? item.cantidadFaltante;
        const costo = editedCostos[item.productoId] ?? item.precioCompraPorUnidadBase;
        return total + calculateTotalCosto(faltante, costo);
      }, 0);
  };

  const handleEditCosto = (productoId: string, value: number) => {
    setEditedCostos(prev => ({
      ...prev,
      [productoId]: Math.max(0, value)
    }));
  };

  const handleDeleteRow = (productoId: string) => {
    setDeletedRows(prev => {
      const newDeletedRows = [...prev, productoId];
      // Forzar actualización del estado
      setTimeout(() => {
        setDeletedRows([...newDeletedRows]);
      }, 0);
      return newDeletedRows;
    });
    
    toast({
      title: "Registro eliminado",
      description: "El producto ha sido removido de la lista",
      variant: "default",
    });
  };

  if (isLoading && !selectedTicket) {
    return (
      <AppLayout title="Analizar Despachos">
        <div className="p-6">
          <Skeleton className="h-10 w-1/3 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="Error">
        <div className="p-6 text-red-500">
          <h2 className="text-xl font-bold mb-4">Error</h2>
          <p>{error}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Analizar Despachos">
      <div className="p-6 space-y-6">
        {!selectedTicket ? (
          <Card>
            <CardHeader>
              <CardTitle>Listado de Despachos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="table-container">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-white bg-blue-800 sticky left-0 z-20">Ticket ID</TableHead>
                      <TableHead className="text-white">Fecha</TableHead>
                      <TableHead className="text-white">Origen</TableHead>
                      <TableHead className="text-white">Destino</TableHead>
                      <TableHead className="text-white">Estado</TableHead>
                      <TableHead className="text-white">Acciones</TableHead> 
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {despachos.map((despacho) => (
                      <TableRow key={despacho.ticketid}>
                        <TableCell>{despacho.ticketid}</TableCell>
                        <TableCell>{despacho.fechaCalculoPedido}</TableCell>
                        <TableCell>{despacho.localSalida}</TableCell>
                        <TableCell>{despacho.localDestino}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            despacho.estadoFaseDespacho === 'DESPACHADO' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {despacho.estadoFaseDespacho}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => fetchDetalleDespacho(despacho.ticketid)}
                          >
                            <Search className="h-4 w-4 mr-2" />
                            Ver Detalle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
              onClick={handleBackToList}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al listado
            </Button>

            {/* Filtros */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                {/* Código Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                  <Input
                    type="text"
                    value={filters.codigo}
                    onChange={(e) => handleFilterChange('codigo', e.target.value)}
                    placeholder="Filtrar por código"
                  />
                </div>
                
                {/* Producto Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                  <Input
                    type="text"
                    value={filters.producto}
                    onChange={(e) => handleFilterChange('producto', e.target.value)}
                    placeholder="Filtrar por producto"
                  />
                </div>
                
                {/* Laboratorio Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Laboratorio</label>
                  <Input
                    type="text"
                    value={filters.laboratorio}
                    onChange={(e) => handleFilterChange('laboratorio', e.target.value)}
                    placeholder="Filtrar por laboratorio"
                  />
                </div>
                
                {/* Faltante Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Faltante</label>
                  <Select
                    value={filters.faltante}
                    onValueChange={(value) => handleFilterChange('faltante', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por faltante" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="mayor_cero">Mayor a 0</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Estado Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <Select
                    value={filters.estado}
                    onValueChange={(value) => handleFilterChange('estado', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="Despachado">Despachado</SelectItem>
                      <SelectItem value="Fallidos">Fallidos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-end space-x-2">
                  <Button 
                    onClick={exportToExcel}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Excel
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                    onClick={() => setEmailDialogOpen(true)}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Email
                  </Button>
                </div>
              </div>
            </div>
            
            <Card>
            <CardHeader>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <CardTitle className="text-2xl">
                        Detalle del Despacho #{selectedTicket}
                      </CardTitle>
                      {detalleDespacho.length > 0 && (
                        <span className="text-2xl font-bold text-gray-600"> 
                          {detalleDespacho[0].codigoLocal} - {detalleDespacho[0].nombreLocal}
                        </span>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      MONTO TOTAL: {getTotalGeneral().toLocaleString('es-EC', { 
                        style: 'currency', 
                        currency: 'USD'
                      })}
                    </div>
                  </div>
                  <CardDescription className="text-sm text-gray-500">
                    {filteredDetalleDespacho.length} productos encontrados
                  </CardDescription>
                </div>
            </CardHeader> 
              <CardContent>
              {isLoadingDetail ? (
                  <div className="flex flex-col items-center justify-center p-12 space-y-4">
                    <div className="animate-bounce">
                      <Truck className="h-16 w-16 text-green-600" />
                    </div>
                    <p className="text-lg font-medium text-gray-700">Cargando detalles del despacho...</p>
                    <p className="text-sm text-gray-500">Por favor espere mientras se cargan los datos</p>
                  </div>
                ) : (
                  <div className="table-container">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-white bg-blue-800 sticky left-0 z-20">Código</TableHead>
                        <TableHead className="text-white">Producto</TableHead>
                        <TableHead className="w-16 text-white">Prest.</TableHead>
                        <TableHead className="text-white">Laboratorio</TableHead>
                        <TableHead className="text-white text-center">Requerido</TableHead>
                        <TableHead className="text-white text-center">Despachado</TableHead>
                        <TableHead className="text-white text-center">Faltante</TableHead>
                        <TableHead className="text-white text-center w-24">Últ. Costo</TableHead>
                        <TableHead className="text-white text-center w-24 bg-orange-500">Total Costo</TableHead>
                        <TableHead className="text-white text-center">WMA</TableHead>
                        <TableHead className="text-white text-center">Stock Bodega</TableHead>
                        <TableHead className="text-white text-center">Stock Local</TableHead>
                        <TableHead className="text-white">Estado</TableHead>
                        <TableHead className="text-white">Referencias</TableHead>
                        <TableHead className="text-white text-center w-16">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredDetalleDespacho.map((item, index) => (
                        <TableRow key={`${item.ticketsbuyUuidAsociado}-${index}`}>
                            <TableCell className="sticky left-0 z-10 bg-white">{item.productoId}</TableCell>
                            <TableCell>{item.nombreProducto}</TableCell>
                            <TableCell className="text-center">{item.presentacion}</TableCell>
                            <TableCell>{item.nombreLaboratorio}</TableCell>
                            <TableCell className="text-center bg-green-100 text-green-800 font-medium">
                            {item.cantidadOptimaRequerida}
                            </TableCell>
                            <TableCell className="text-center bg-blue-100 text-blue-800 font-medium">
                            {item.cantidadDespachaBodega}
                            </TableCell>
                            <TableCell className="text-center bg-red-100">
                            <Input
                              type="number"
                              className="w-16 text-center bg-white border-red-300 mx-auto"
                              value={editedValues[item.productoId] || item.cantidadFaltante}
                              onChange={(e) => handleEditFaltante(item.productoId, parseInt(e.target.value))}
                            />
                            </TableCell>
                            <TableCell className="text-right">
                            <Input
                              type="number"
                              className="w-24 text-right bg-white border-blue-300"
                              value={editedCostos[item.productoId] || item.precioCompraPorUnidadBase?.toFixed(2) || '0.00'}
                              onChange={(e) => handleEditCosto(item.productoId, parseFloat(e.target.value))}
                              step="0.01"
                            />
                            </TableCell>
                            <TableCell 
                              className="text-right bg-orange-100 text-orange-800 font-medium whitespace-nowrap"
                              style={{ backgroundColor: 'rgb(255, 237, 213)' }} // Asegura color consistente
                            >
                              {calculateTotalCosto(
                                editedValues[item.productoId] ?? item.cantidadFaltante,
                                editedCostos[item.productoId] ?? item.precioCompraPorUnidadBase
                              ).toLocaleString('es-EC', { style: 'currency', currency: 'USD' })}
                            </TableCell>
                            <TableCell className="text-center bg-yellow-100 text-yellow-800 font-medium">
                            {item.wmaDemandaPacks.toFixed(1)}
                            </TableCell>
                            <TableCell className="text-center">{item.stockBodegaMomentoCalculo}</TableCell>
                            <TableCell className="text-center">{item.stockLocalMomentoCalculo}</TableCell>
                            <TableCell>{item.estadoRegistro}</TableCell>
                            <TableCell className="text-xs max-w-xs truncate">
                            {formatReferencias(item.referenciasUltimasCompras)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteRow(item.productoId)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar por correo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
                placeholder="ejemplo@dominio.com"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setEmailDialogOpen(false)}
              disabled={isSending}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSendEmail}
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando...
                </>
              ) : 'Enviar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default AnalizarDespachos;

