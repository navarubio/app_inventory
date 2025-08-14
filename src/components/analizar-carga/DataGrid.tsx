import { SateliteView } from "@/types/analizar-carga";
import { formatDate } from "@/lib/formatDate";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DataGridProps {
  data: SateliteView[];
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

const DataGrid = ({ data, currentPage, itemsPerPage, totalItems, onPageChange }: DataGridProps) => {
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Función para determinar el color de la celda de fecha de vencimiento
  const getExpirationCellClass = (fechaVencimiento?: string) => {
    if (!fechaVencimiento) return '';
    
    const currentDate = new Date();
    const expirationDate = new Date(fechaVencimiento);
    
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const expirationMonth = expirationDate.getMonth();
    const expirationYear = expirationDate.getFullYear();
    
    // Calcular la diferencia en meses
    const monthDiff = (expirationYear - currentYear) * 12 + (expirationMonth - currentMonth);
    
    if (monthDiff < 0) {
      return 'bg-red-100'; // Ya vencido
    } else if (monthDiff === 0) {
      return 'bg-red-500 text-white'; // Vence este mes
    } else if (monthDiff === 1) {
      return 'bg-yellow-500 text-white'; // Vence el próximo mes
    } else if (monthDiff === 2) {
      return 'bg-green-500 text-white'; // Vence en dos meses
    }
    
    return ''; // Más de dos meses, sin color especial
  };

  // Función para determinar si una fila completa debe estar en rojo
  const getRowClass = (fechaVencimiento?: string) => {
    if (!fechaVencimiento) return 'hover:bg-gray-50';
    
    const currentDate = new Date();
    const expirationDate = new Date(fechaVencimiento);
    
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const expirationMonth = expirationDate.getMonth();
    const expirationYear = expirationDate.getFullYear();
    
    // Calcular la diferencia en meses
    const monthDiff = (expirationYear - currentYear) * 12 + (expirationMonth - currentMonth);
    
    if (monthDiff < 0) {
      return 'bg-red-100 hover:bg-red-200'; // Producto ya vencido
    }
    
    return 'hover:bg-gray-50';
  };

  // Función para determinar el color de la celda de lote con error
  const getLotErrorClass = (lotNumber?: string) => {
    if (!lotNumber) return '';
    return lotNumber.includes('_ERR') ? 'bg-red-100 text-red-700 font-semibold' : '';
  };

  const handleSort = (field: string) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0;

    let aValue = a[sortField as keyof SateliteView];
    let bValue = b[sortField as keyof SateliteView];

    if (sortField === 'fechavencimiento' || sortField === 'fechafabricacion' || sortField === 'fechainsert') {
      aValue = new Date(aValue as string).getTime();
      bValue = new Date(bValue as string).getTime();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getSortIcon = (field: string) => {
    if (sortField !== field) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-sm w-full">
      <table className="w-full divide-y divide-gray-200" style={{ fontSize: '14px' }}>
        <thead className="bg-gray-50">
          <tr>
            <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Local</th>
            <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
            <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Laboratorio</th>
            <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Código</th>
            <th 
              className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('productName')}
            >
              Producto {getSortIcon('productName')}
            </th>
            <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Presentación</th>
            <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Lote</th>
            <th className="px-2 py-1 text-right font-medium text-gray-500 uppercase tracking-wider">Cajas</th>
            <th className="px-2 py-1 text-right font-medium text-gray-500 uppercase tracking-wider">Unidades</th>
            <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">F. Fabricación</th>
            <th 
              className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('fechavencimiento')}
            >
              F. Venc. {getSortIcon('fechavencimiento')}
            </th>
            <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">Operador</th>
            <th className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider">F. Inserc.</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.length > 0 ? (
            sortedData.map((item, index) => (
              <tr key={index} className={getRowClass(item.fechavencimiento)}>
                <td className="px-2 py-1 whitespace-nowrap">{item.local}</td>
                <td className="px-2 py-1 whitespace-nowrap">{item.locationName}</td>
                <td className="px-2 py-1 whitespace-nowrap">{item.laboratorio}</td>
                <td className="px-2 py-1 whitespace-nowrap">{item.product}</td>
                <td className="px-2 py-1 whitespace-nowrap">{item.productName}</td>
                <td className="px-2 py-1 whitespace-nowrap">{item.presentacion}</td>
                <td className={`px-2 py-1 whitespace-nowrap ${getLotErrorClass(item.numerolote)}`}>
                  {item.numerolote}
                </td>
                <td className="px-2 py-1 whitespace-nowrap text-right">{item.cantidadCajas}</td>
                <td className="px-2 py-1 whitespace-nowrap text-right">{item.unidades}</td>
                <td className="px-2 py-1 whitespace-nowrap">{formatDate(item.fechafabricacion)}</td>
                <td className={`px-2 py-1 whitespace-nowrap ${getExpirationCellClass(item.fechavencimiento)}`}>
                  {formatDate(item.fechavencimiento)}
                </td>
                <td className="px-2 py-1 whitespace-nowrap">{item.operador}</td>
                <td className="px-2 py-1 whitespace-nowrap">{formatDate(item.fechainsert)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={13} className="px-2 py-4 text-center text-gray-500">
                No se encontraron resultados.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Paginación */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="flex justify-between flex-1 sm:hidden">
          <Button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
          >
            Anterior
          </Button>
          <Button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
          >
            Siguiente
          </Button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> a{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, totalItems)}
              </span>{' '}
              de <span className="font-medium">{totalItems}</span> resultados
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <Button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">Anterior</span>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </Button>
              <Button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">Siguiente</span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataGrid;