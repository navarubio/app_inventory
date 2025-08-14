import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FilterX, Search, FileSpreadsheet, FileText, Mail, AlertCircle } from "lucide-react";
import { FilterParams } from "@/types/analizar-carga";

interface FilterSectionProps {
  laboratories: any[];
  locations: any[];
  uniqueLots: string[];
  onFilterChange: (filters: FilterParams) => void;
  onClearFilters: () => void;
  onExportToExcel: () => void;
  onExportToPDF: () => void;
  onSearchClick: () => void;
  onSendEmail: () => void;
  onExpirationFilter: (filterType: string) => void;
  selectedFilter: string | null;
}

const FilterSection = ({
  onFilterChange,
  onClearFilters,
  onExportToExcel,
  onExportToPDF,
  onSearchClick,
  onSendEmail,
  onExpirationFilter,
  selectedFilter
}: FilterSectionProps) => {
  const [productId, setProductId] = useState("");
  const [productName, setProductName] = useState("");
  const [laboratory, setLaboratory] = useState("");
  const [location, setLocation] = useState("");
  const [lotNumber, setLotNumber] = useState("");

  const handleProductIdChange = (value: string) => {
    setProductId(value);
    onFilterChange({
      productId: value,
      productName,
      laboratory,
      location,
      lotNumber
    });
  };

  const handleProductNameChange = (value: string) => {
    setProductName(value);
    onFilterChange({
      productId,
      productName: value,
      laboratory,
      location,
      lotNumber
    });
  };

  const handleLaboratoryChange = (value: string) => {
    setLaboratory(value);
    onFilterChange({
      productId,
      productName,
      laboratory: value,
      location,
      lotNumber
    });
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    onFilterChange({
      productId,
      productName,
      laboratory,
      location: value,
      lotNumber
    });
  };

  const handleLotNumberChange = (value: string) => {
    setLotNumber(value);
    onFilterChange({
      productId,
      productName,
      laboratory,
      location,
      lotNumber: value
    });
  };

  const handleClearFilters = () => {
    setProductId("");
    setProductName("");
    setLaboratory("");
    setLocation("");
    setLotNumber("");
    onClearFilters();
  };

  return (
    <div className="bg-white p-2 rounded-lg shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <Search className="mr-2 text-[#1B365D]" size={20} />
          Filtros de búsqueda
        </h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            onClick={onExportToExcel}
          >
            <FileSpreadsheet className="mr-2" size={16} />
            Exportar Excel
          </Button>
          <Button
            variant="outline"
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
            onClick={onExportToPDF}
          >
            <FileText className="mr-2" size={16} />
            Exportar PDF
          </Button>
        </div>
      </div>

      <div className="flex space-x-2 mb-4">
        <Button
          variant="outline"
          className={`${selectedFilter === 'vencidos' ? 'bg-pink-100' : ''} text-pink-700 border-pink-200`}
          onClick={() => onExpirationFilter('vencidos')}
        >
          <AlertCircle className="mr-2" size={16} />
          Vencidos
        </Button>
        <Button
          variant="outline"
          className={`${selectedFilter === 'mes_actual' ? 'bg-red-100' : ''} text-red-700 border-red-200`}
          onClick={() => onExpirationFilter('mes_actual')}
        >
          <AlertCircle className="mr-2" size={16} />
          Vence Mes Actual
        </Button>
        <Button
          variant="outline"
          className={`${selectedFilter === 'mes_siguiente' ? 'bg-yellow-100' : ''} text-yellow-700 border-yellow-200`}
          onClick={() => onExpirationFilter('mes_siguiente')}
        >
          <AlertCircle className="mr-2" size={16} />
          Vence Mes Siguiente
        </Button>
        <Button
          variant="outline"
          className={`${selectedFilter === 'mes_posterior' ? 'bg-green-100' : ''} text-green-700 border-green-200`}
          onClick={() => onExpirationFilter('mes_posterior')}
        >
          <AlertCircle className="mr-2" size={16} />
          Vence Mes Posterior
        </Button>
        <Button
              variant="outline"
              className={`${selectedFilter === 'error' ? 'bg-red-100' : ''} text-red-700 border-red-200`}
              onClick={() => onExpirationFilter('error')}
            >
              <AlertCircle className="mr-2" size={16} />
              Carga con Error
        </Button>
        <Button
          variant="outline"
          className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
          onClick={onSendEmail}
        >
          <Mail className="mr-2" size={16} />
          Enviar por Email
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código Producto
          </label>
          <Input
            placeholder="Buscar por código..."
            value={productId}
            onChange={(e) => handleProductIdChange(e.target.value)}
            className="w-full bg-gray-50 border-gray-200"
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Producto
          </label>
          <Input
            placeholder="Buscar por nombre..."
            value={productName}
            onChange={(e) => handleProductNameChange(e.target.value)}
            className="w-full bg-gray-50 border-gray-200"
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Laboratorio
          </label>
          <Input
            placeholder="Buscar laboratorio..."
            value={laboratory}
            onChange={(e) => handleLaboratoryChange(e.target.value)}
            className="w-full bg-gray-50 border-gray-200"
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Local
          </label>
          <Input
            placeholder="Buscar local..."
            value={location}
            onChange={(e) => handleLocationChange(e.target.value)}
            className="w-full bg-gray-50 border-gray-200"
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lote
          </label>
          <Input
            placeholder="Buscar lote..."
            value={lotNumber}
            onChange={(e) => handleLotNumberChange(e.target.value)}
            className="w-full bg-gray-50 border-gray-200"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end space-x-3">
        <Button
          variant="outline"
          className="text-gray-600 border-gray-300 hover:bg-gray-100"
          onClick={handleClearFilters}
        >
          <FilterX className="mr-2" size={16} />
          Limpiar filtros
        </Button>
        <Button
          variant="default"
          className="bg-[#1B365D] hover:bg-[#0F2A4A]"
          onClick={onSearchClick}
        >
          <Search className="mr-2" size={16} />
          Consultar
        </Button>
      </div>
    </div>
  );
};

export default FilterSection;