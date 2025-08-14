
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUp, Database, Check, X, FileText } from "lucide-react";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const ConciliarCargar = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      // Reset progress
      setUploadProgress(0);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast.error("Por favor seleccione un archivo primero");
      return;
    }

    setIsUploading(true);
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 1;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Simulate completion after progress reaches 100%
        setTimeout(() => {
          setIsUploading(false);
          toast.success("Archivo cargado y conciliado correctamente");
          setSelectedFile(null);
        }, 500);
      }
      setUploadProgress(progress);
    }, 300);
  };

  // Datos de ejemplo para las conciliaciones recientes
  const conciliaciones = [
    { id: "CON-001", archivo: "stock_mayo_2023.xlsx", fecha: "10/05/2023", registros: 234, estado: "success" },
    { id: "CON-002", archivo: "stock_abril_2023.xlsx", fecha: "12/04/2023", registros: 186, estado: "success" },
    { id: "CON-003", archivo: "stock_marzo_2023.xlsx", fecha: "08/03/2023", registros: 210, estado: "error" },
    { id: "CON-004", archivo: "stock_febrero_2023.xlsx", fecha: "15/02/2023", registros: 178, estado: "success" },
  ];

  return (
    <AppLayout title="Conciliar Cargar">
      <div className="space-y-8">
        {/* Sección de carga */}
        <Card>
          <CardHeader>
            <CardTitle>Conciliación de Inventario</CardTitle>
            <CardDescription>
              Cargue un archivo CSV o Excel para conciliar con el inventario actual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <FileUp className="h-12 w-12 text-gray-400 mb-3" />
                <span className="text-lg font-medium text-gray-700">
                  {selectedFile ? selectedFile.name : "Seleccione un archivo"}
                </span>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedFile 
                    ? `Tamaño: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` 
                    : "Formatos soportados: CSV, XLSX"}
                </p>
              </label>
            </div>

            {selectedFile && (
              <div className="space-y-3">
                {isUploading && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Progreso</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </>
                )}
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedFile(null)}
                    disabled={isUploading}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="bg-[#1B365D] hover:bg-[#152a4a]"
                  >
                    {isUploading ? "Procesando..." : "Iniciar Carga"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conciliaciones recientes */}
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Conciliaciones Recientes
          </h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Archivo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registros
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {conciliaciones.map((conciliacion) => (
                    <tr key={conciliacion.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {conciliacion.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-blue-500" />
                        {conciliacion.archivo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {conciliacion.fecha}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {conciliacion.registros}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {conciliacion.estado === "success" ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            <Check className="h-4 w-4 mr-1" /> Exitoso
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            <X className="h-4 w-4 mr-1" /> Con errores
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                          Ver detalles
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ConciliarCargar;
