import { useAnalizarCargaData } from "@/hooks/useAnalizarCargaData";
import AppLayout from "@/components/AppLayout";
import FilterSection from "@/components/analizar-carga/FilterSection";
import LoadingIndicator from "@/components/dashboard/LoadingIndicator";
import ErrorDisplay from "@/components/dashboard/ErrorDisplay";
import DataGrid from "@/components/analizar-carga/DataGrid";
import { EmailDialog } from "@/components/analizar-carga/EmailDialog";
import { useState } from "react";
import { FilterParams, SateliteView } from "@/types/analizar-carga";
import { toast } from "sonner";
import { sendEmailReport } from "@/services/emailService";

const AnalizarCarga = () => {
  // Estados
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [dataRequested, setDataRequested] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [filteredSatelites, setFilteredSatelites] = useState<SateliteView[]>([]);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [toastTimeout, setToastTimeout] = useState<NodeJS.Timeout | null>(null);

  // Hook personalizado
  const {
    laboratories,
    locations,
    satelites,
    uniqueLots,
    isLoading,
    isError,
    error,
    filters,
    applyFilters,
    clearFilters,
    searchData,
    exportToExcel,
    exportToPDF
  } = useAnalizarCargaData();

  // Funciones auxiliares
  const simulateProgress = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      if (progress >= 90) {
        clearInterval(interval);
      }
      setLoadingProgress(progress);
    }, 50);
    return interval;
  };

  const clearToast = () => {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
  };

  // Manejadores de eventos
  const handleSearch = async () => {
    setIsLoadingData(true);
    setDataRequested(true);
    const progressInterval = simulateProgress();
    
    try {
      await searchData();
    } finally {
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setTimeout(() => {
        setIsLoadingData(false);
      }, 500);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    setIsLoadingData(true);
    const progressInterval = simulateProgress();
    
    try {
      await searchData();
    } finally {
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setIsRetrying(false);
      setTimeout(() => {
        setIsLoadingData(false);
      }, 500);
    }
  };

  const handleClearFilters = async () => {
    setIsLoadingData(true);
    const progressInterval = simulateProgress();
    
    try {
      clearFilters();
      setDataRequested(false);
      setSelectedFilter(null);
      setFilteredSatelites([]);
    } finally {
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setTimeout(() => {
        setIsLoadingData(false);
      }, 500);
    }
  };

  const handleExportExcel = async () => {
    setIsLoadingData(true);
    const progressInterval = simulateProgress();
    clearToast();
    
    try {
      await exportToExcel();
      const timeout = setTimeout(() => {
        toast.dismiss();
      }, 3000);
      setToastTimeout(timeout);
    } finally {
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setTimeout(() => {
        setIsLoadingData(false);
      }, 500);
    }
  };

  const handleExportPDF = async () => {
    setIsLoadingData(true);
    const progressInterval = simulateProgress();
    clearToast();
    
    try {
      await exportToPDF();
      const timeout = setTimeout(() => {
        toast.dismiss();
      }, 3000);
      setToastTimeout(timeout);
    } finally {
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setTimeout(() => {
        setIsLoadingData(false);
      }, 500);
    }
  };

  const handleSendEmail = async (email: string, message: string) => {
    setIsLoadingData(true);
    const progressInterval = simulateProgress();
    clearToast();
    
    try {
      const currentData = selectedFilter ? filteredSatelites : satelites;
      await sendEmailReport(email, message, currentData);
      toast.success('Reporte enviado por correo electrónico');
      const timeout = setTimeout(() => {
        toast.dismiss();
      }, 3000);
      setToastTimeout(timeout);
    } catch (error) {
      toast.error('Error al enviar el reporte por correo');
    } finally {
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setTimeout(() => {
        setIsLoadingData(false);
      }, 500);
    }
  };

  const handleFilterChange = (filters: FilterParams) => {
    setSelectedFilter(null);
    setFilteredSatelites([]);
    applyFilters(filters);
  };

  const handleExpirationFilter = (filterType: string) => {
    setSelectedFilter(filterType);
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const filtered = satelites.filter(item => {
      if (!item.fechavencimiento) return false;
      
      const expirationDate = new Date(item.fechavencimiento);
      const expirationMonth = expirationDate.getMonth();
      const expirationYear = expirationDate.getFullYear();
      const monthDiff = (expirationYear - currentYear) * 12 + (expirationMonth - currentMonth);

      switch (filterType) {
        case 'vencidos':
          return monthDiff < 0;
        case 'mes_actual':
          return monthDiff === 0;
        case 'mes_siguiente':
          return monthDiff === 1;
        case 'mes_posterior':
          return monthDiff === 2;
        case 'error':
          return item.numerolote.includes('_ERR');
        default:
          return true;
      }
    });

    setFilteredSatelites(filtered);
  };

  // Cálculos para la paginación
  const displayData = selectedFilter ? filteredSatelites : satelites;
  const totalItems = displayData.length;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = displayData.slice(indexOfFirstItem, indexOfLastItem);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Renderizado
  return (
    <AppLayout title="Analizar Carga">
      <div className="w-full px-4 py-8">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <FilterSection
              laboratories={laboratories}
              locations={locations}
              uniqueLots={uniqueLots}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              onExportToExcel={handleExportExcel}
              onExportToPDF={handleExportPDF}
              onSearchClick={handleSearch}
              onSendEmail={() => setIsEmailDialogOpen(true)}
              onExpirationFilter={handleExpirationFilter}
              selectedFilter={selectedFilter}
            />
          </div>

          {isLoadingData && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <LoadingIndicator 
                progress={loadingProgress} 
                message="Cargando datos..." 
              />
            </div>
          )}

          {isError && !isLoadingData && (
            <div className="flex items-center justify-center bg-white rounded-lg shadow-sm p-4">
              <ErrorDisplay
                errorDetails={error?.toString() || "Error al cargar los datos"}
                onRetry={handleRetry}
                isRetrying={isRetrying}
              />
            </div>
          )}

          {!isLoadingData && !isError && dataRequested && displayData.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm w-full overflow-x-auto">
              <DataGrid 
                data={currentItems} 
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
                onPageChange={paginate}
              />
            </div>
          )}

          {!isLoadingData && !isError && dataRequested && displayData.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <p className="text-gray-600">No hay datos que coincidan con los criterios de búsqueda</p>
            </div>
          )}
        </div>
      </div>

      <EmailDialog
        isOpen={isEmailDialogOpen}
        onClose={() => setIsEmailDialogOpen(false)}
        onSend={handleSendEmail}
      />
    </AppLayout>
  );
};

export default AnalizarCarga;