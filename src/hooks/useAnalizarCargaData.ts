import { useQuery } from "@tanstack/react-query";
import { SateliteView, Laboratory, Location, FilterParams } from "@/types/analizar-carga";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Función auxiliar para formatear fechas en formato dd/MM/yyyy
const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '/');
};

// Función para escapar caracteres especiales en la URL
const encodeParam = (param: string) => {
  if (!param || param.trim() === '') return '';
  
  // Reemplazar caracteres problemáticos antes de codificar
  let sanitizedParam = param.trim()
    .replace(/#/g, '%23')  // Reemplazar # directamente
    .replace(/\//g, '%2F') // Reemplazar / directamente
    .replace(/:/g, '%3A'); // Reemplazar : directamente
    
  // Aplicar encodeURIComponent para manejar otros caracteres
  return encodeURIComponent(sanitizedParam);
};

// Función para construir la URL de búsqueda
const buildSearchUrl = (filters: FilterParams): string => {
  const baseUrl = "http://10.10.10.251:8890/api/inventory/satelites";

  if (filters.lotNumber && filters.lotNumber.trim() !== '') {
    return `${baseUrl}/numerolote/${encodeParam(filters.lotNumber)}`;
  }
  if (filters.location && filters.location.trim() !== '') {
    return `${baseUrl}/location_name/${encodeParam(filters.location)}`;
  }
  if (filters.laboratory && filters.laboratory.trim() !== '') {
    return `${baseUrl}/laboratorio/${encodeParam(filters.laboratory)}`;
  }
  if (filters.productId && filters.productId.trim() !== '') {
    return `${baseUrl}/product/${encodeParam(filters.productId)}`;
  }
  if (filters.productName && filters.productName.trim() !== '') {
    return `${baseUrl}/product_name/${encodeParam(filters.productName)}`;
  }

  return baseUrl;
};

// Función para buscar satélites
const fetchSatelites = async (filters: FilterParams): Promise<SateliteView[]> => {
  try {
    const url = buildSearchUrl(filters);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error en la búsqueda: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching satelites:", error);
    throw error;
  }
};

async function fetchLaboratories(): Promise<Laboratory[]> {
  try {
    const response = await fetch('http://10.10.10.251:8890/api/laboratorio/attributesets');
    if (!response.ok) throw new Error('Error fetching laboratories');
    return response.json();
  } catch (error) {
    console.error("Error fetching laboratories:", error);
    return [];
  }
}

async function fetchLocations(): Promise<Location[]> {
  try {
    const response = await fetch('http://10.10.10.251:8890/api/inventory/locations');
    if (!response.ok) throw new Error('Error fetching locations');
    return response.json();
  } catch (error) {
    console.error("Error fetching locations:", error);
    return [];
  }
}

export function useAnalizarCargaData() {
  const [filters, setFilters] = useState<FilterParams>({});
  const [shouldFetchData, setShouldFetchData] = useState(true); // Iniciar en true para cargar datos al inicio
  
  // Fetch laboratories
  const laboratoriesQuery = useQuery({
    queryKey: ['laboratories'],
    queryFn: fetchLaboratories,
    staleTime: 5 * 60 * 1000,
    retry: 3,
    refetchOnWindowFocus: false,
    initialData: []
  });
  
  // Fetch locations
  const locationsQuery = useQuery({
    queryKey: ['locations'],
    queryFn: fetchLocations,
    staleTime: 5 * 60 * 1000,
    retry: 3,
    refetchOnWindowFocus: false,
    initialData: []
  });
  
  // Fetch satelites data
  const satelitesQuery = useQuery({
    queryKey: ['satelites', filters],
    queryFn: () => fetchSatelites(filters),
    staleTime: 2 * 60 * 1000,
    retry: 2,
    enabled: shouldFetchData,
    refetchOnWindowFocus: false
  });
  
  // Show error toasts when queries fail
  if (laboratoriesQuery.error) {
    toast.error('Error al cargar laboratorios', {
      description: laboratoriesQuery.error instanceof Error ? laboratoriesQuery.error.message : 'Error desconocido',
    });
  }
  
  if (locationsQuery.error) {
    toast.error('Error al cargar locales', {
      description: locationsQuery.error instanceof Error ? locationsQuery.error.message : 'Error desconocido',
    });
  }
  
  if (satelitesQuery.error) {
    toast.error('Error al cargar datos', {
      description: satelitesQuery.error instanceof Error ? satelitesQuery.error.message : 'Error desconocido',
    });
  }
  
  // Function to apply new filters
  const applyFilters = (newFilters: FilterParams) => {
    const processedFilters: FilterParams = {};
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== "todos" && value.trim() !== "") {
        processedFilters[key as keyof FilterParams] = value.trim();
      }
    });
    setFilters(processedFilters);
    setShouldFetchData(true); // Activar la búsqueda al aplicar filtros
  };
  
  // Function to clear all filters
  const clearFilters = () => {
    setFilters({});
    setShouldFetchData(true); // Activar la búsqueda al limpiar filtros
  };
  
  // Function to trigger data fetching
  const searchData = () => {
    setShouldFetchData(true);
    satelitesQuery.refetch(); // Forzar la recarga de datos
  };
  
  // Get unique lots from the satelites data
  const uniqueLots = Array.from(
    new Set(
      satelitesQuery.data?.map(item => item.numerolote).filter(Boolean) || []
    )
  ).sort();
  
  // Function to export to Excel
  const exportToExcel = async () => {
    if (!satelitesQuery.data || satelitesQuery.data.length === 0) {
      toast.error('No hay datos para exportar', {
        description: 'Realice una consulta primero para obtener datos.'
      });
      return;
    }
    
    try {
      toast.loading('Generando Excel...');
      
      // Preparar los datos para Excel con el orden correcto de columnas
      const excelData = satelitesQuery.data.map(item => ({
        'Local': item.local,
        'Ubicación': item.locationName,
        'Laboratorio': item.laboratorio,
        'Código Producto': item.product,
        'Nombre Producto': item.productName,
        'Presentación': item.presentacion,
        'Número Lote': item.numerolote,
        'Cantidad Cajas': item.cantidadCajas,
        'Unidades': item.unidades,
        'Fecha Fabricación': formatDate(item.fechafabricacion),
        'Fecha Vencimiento': formatDate(item.fechavencimiento),
        'Operador': item.operador,
        'Fecha Inserción': formatDate(item.fechainsert)
      }));
      
      // Crear libro de Excel
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
      
      // Generar archivo Excel y descargarlo
      XLSX.writeFile(workbook, "analisis_carga.xlsx");
      
      toast.dismiss();
      toast.success('Excel generado correctamente', {
        description: 'El archivo se ha descargado exitosamente.'
      });
    } catch (error) {
      toast.dismiss();
      toast.error('Error al generar Excel', {
        description: 'Ocurrió un error al generar el archivo.'
      });
      console.error('Error exporting to Excel:', error);
    }
  };
  
  // Function to export to PDF
  const exportToPDF = async () => {
    if (!satelitesQuery.data || satelitesQuery.data.length === 0) {
      toast.error('No hay datos para exportar', {
        description: 'Realice una consulta primero para obtener datos.'
      });
      return;
    }
    
    try {
      toast.loading('Generando PDF...');
      
      // Crear documento PDF
      const doc = new jsPDF('landscape');
      
      // Título del documento
      doc.setFontSize(18);
      doc.text('Análisis de Carga', 14, 22);
      
      // Fecha de generación
      doc.setFontSize(11);
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 30);
      
      // Preparar datos para la tabla
      const tableColumn = [
        'Local', 
        'Ubicación', 
        'Laboratorio', 
        'Código', 
        'Producto', 
        'Presentación', 
        'Lote', 
        'Cajas', 
        'Unidades', 
        'F. Fabricación',
        'F. Venc.',
        'Operador',
        'F. Inserc.'
      ];
      
      const tableRows = satelitesQuery.data.map(item => [
        item.local,
        item.locationName,
        item.laboratorio,
        item.product,
        item.productName,
        item.presentacion,
        item.numerolote,
        item.cantidadCajas,
        item.unidades,
        formatDate(item.fechafabricacion),
        formatDate(item.fechavencimiento),
        item.operador,
        formatDate(item.fechainsert)
      ]);
      
      // Generar tabla en el PDF
      (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [27, 54, 93] }
      });
      
      // Guardar PDF
      doc.save('analisis_carga.pdf');
      
      toast.dismiss();
      toast.success('PDF generado correctamente', {
        description: 'El archivo se ha descargado exitosamente.'
      });
    } catch (error) {
      toast.dismiss();
      toast.error('Error al generar PDF', {
        description: 'Ocurrió un error al generar el archivo.'
      });
      console.error('Error exporting to PDF:', error);
    }
  };
  
  return {
    laboratories: laboratoriesQuery.data || [],
    locations: locationsQuery.data || [],
    satelites: satelitesQuery.data || [],
    uniqueLots,
    isLoading: laboratoriesQuery.isLoading || locationsQuery.isLoading || satelitesQuery.isLoading,
    isError: laboratoriesQuery.isError || locationsQuery.isError || satelitesQuery.isError,
    error: laboratoriesQuery.error || locationsQuery.error || satelitesQuery.error,
    filters,
    applyFilters,
    clearFilters,
    searchData,
    exportToExcel,
    exportToPDF,
    refetch: satelitesQuery.refetch
  };


  
}
