import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { DataTable } from "@/components/DataTable";
import { parseXMLFile, type InvoiceDetail, type InvoiceHeader } from "@/utils/xmlParser";
import { toast } from "sonner";
import { Loader2, FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';
import AppLayout from "@/components/AppLayout";

const Index = () => {
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetail[]>([]);
  const [invoiceHeader, setInvoiceHeader] = useState<InvoiceHeader | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleFileSelect = async (file: File) => {
    try {
      const { header, details } = await parseXMLFile(file);
      setInvoiceHeader(header);
      setInvoiceDetails(details);
      toast.success("Archivo XML procesado exitosamente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al procesar el archivo XML");
      console.error(error);
    }
  };

  const handleSaveData = async () => {
    setIsSaving(true);
    try {
      // Crear el contenido del archivo JSON
      const dataToExport = {
        header: invoiceHeader,
        details: invoiceDetails
      };
      
      // Convertir a string JSON con formato
      const jsonString = JSON.stringify(dataToExport, null, 2);
      
      // Crear el blob y el link de descarga
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `factura_${invoiceHeader?.numeroFactura.replace(/-/g, '')}.json`;
      
      // Simular proceso de guardado
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Descargar el archivo
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Datos exportados exitosamente");
    } catch (error) {
      toast.error("Error al exportar los datos");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportToExcel = async () => {
    setIsExporting(true);
    try {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(invoiceDetails.map(item => ({
        'Código Principal': item.codigoPrincipal,
        'Código Auxiliar': item.codigoAuxiliar,
        'Descripción': item.descripcion,
        'Cantidad': item.cantidad,
        'Precio Unitario': item.precioUnitario,
        'Número de Lote': item.lote,
        'Fecha Fabricación': item.fechaFabricacion,
        'Fecha Vencimiento': item.fechaVencimiento
      })));

      XLSX.utils.book_append_sheet(workbook, worksheet, "Detalles");

      // Simular proceso de exportación
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      XLSX.writeFile(workbook, `factura_${invoiceHeader?.numeroFactura.replace(/-/g, '')}.xlsx`);
      
      toast.success("Archivo Excel exportado exitosamente");
    } catch (error) {
      toast.error("Error al exportar a Excel");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const getCompletedRowsCount = () => {
    return invoiceDetails.filter(item => item.lote && item.fechaFabricacion && item.fechaVencimiento).length;
  };

  return (
    <AppLayout title="Completar Compras">
      <div className="space-y-8">
        <div className="bg-white p-8 rounded-xl shadow-sm">
          <FileUpload onFileSelect={handleFileSelect} />
        </div>

        {invoiceHeader && (
          <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-[#1B365D]">Información del Proveedor</h3>
                <p><span className="font-medium">Razón Social:</span> {invoiceHeader.razonSocial}</p>
                <p><span className="font-medium">RUC:</span> {invoiceHeader.ruc}</p>
                <p><span className="font-medium">N° Factura:</span> {invoiceHeader.numeroFactura}</p>
                <p><span className="font-medium">Fecha Factura:</span> {invoiceHeader.fechaEmision}</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-[#1B365D]">Información del Cliente</h3>
                <p><span className="font-medium">Razón Social:</span> {invoiceHeader.razonSocialComprador}</p>
                <p><span className="font-medium">RUC:</span> {invoiceHeader.identificacionComprador}</p>
              </div>
            </div>
          </div>
        )}

        {invoiceDetails.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#1B365D]">
              Detalles de la Factura
            </h2>
            <DataTable
              data={invoiceDetails}
              onDataUpdate={setInvoiceDetails}
            />
            <div className="flex justify-between items-center mt-4">
              <div className="space-x-8">
                <span className="text-gray-600">
                  <span className="font-medium">Total de productos:</span> {invoiceDetails.length}
                </span>
                <span className="text-gray-600">
                  <span className="font-medium">Registros completos:</span> {getCompletedRowsCount()}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleExportToExcel}
                  disabled={isExporting}
                  className="px-4 py-2 bg-[#8CC63F] text-white rounded-lg hover:bg-[#7BB32F] transition-colors flex items-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      Exportar Excel
                    </>
                  )}
                </button>
                <button
                  onClick={handleSaveData}
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#1B365D] text-white rounded-lg hover:bg-[#152a4a] transition-colors flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Guardar Datos'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
