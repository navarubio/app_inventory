
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, AlertTriangle, Clock, Search } from "lucide-react";

const AnalizarLotes = () => {
  // Datos de ejemplo para lotes
  const lotes = [
    { id: "L-20230001", proveedor: "PRODE-FARM S.A.", fecha: "15/04/2023", productos: 12, estado: "completo" },
    { id: "L-20230002", proveedor: "FARMACÉUTICA CONTINENTAL", fecha: "18/04/2023", productos: 8, estado: "pendiente" },
    { id: "L-20230003", proveedor: "DISTRIBUIDORA FARMACÉUTICA", fecha: "20/04/2023", productos: 15, estado: "error" },
    { id: "L-20230004", proveedor: "PHARMACORP", fecha: "22/04/2023", productos: 6, estado: "completo" },
    { id: "L-20230005", proveedor: "LABORATORIOS ECUATORIANOS", fecha: "24/04/2023", productos: 10, estado: "completo" },
    { id: "L-20230006", proveedor: "PHARMABRAND S.A.", fecha: "26/04/2023", productos: 9, estado: "pendiente" },
  ];

  // Función para obtener el icono según el estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completo":
        return <CheckCircle className="text-green-500" size={18} />;
      case "pendiente":
        return <Clock className="text-amber-500" size={18} />;
      case "error":
        return <AlertTriangle className="text-red-500" size={18} />;
      default:
        return null;
    }
  };

  // Función para obtener el texto según el estado
  const getStatusText = (status: string) => {
    switch (status) {
      case "completo":
        return "Completo";
      case "pendiente":
        return "Pendiente";
      case "error":
        return "Con errores";
      default:
        return "";
    }
  };

  // Función para obtener el color según el estado
  const getStatusClass = (status: string) => {
    switch (status) {
      case "completo":
        return "bg-green-100 text-green-800";
      case "pendiente":
        return "bg-amber-100 text-amber-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "";
    }
  };

  return (
    <AppLayout title="Analizar Lotes">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-700">
            Gestión de Lotes de Productos
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar lotes..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B365D] focus:border-transparent"
            />
          </div>
        </div>

        <Tabs defaultValue="todos" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-md">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="completos">Completos</TabsTrigger>
            <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
            <TabsTrigger value="errores">Con Errores</TabsTrigger>
          </TabsList>
          <TabsContent value="todos" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lotes.map((lote) => (
                <Card key={lote.id} className="hover:shadow-md transition-all cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-medium">{lote.id}</CardTitle>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusClass(lote.estado)}`}>
                        {getStatusIcon(lote.estado)}
                        {getStatusText(lote.estado)}
                      </span>
                    </div>
                    <CardDescription>{lote.proveedor}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-gray-500">Fecha</p>
                      <p className="font-medium">{lote.fecha}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Productos</p>
                      <p className="font-medium">{lote.productos}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="completos" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lotes
                .filter((lote) => lote.estado === "completo")
                .map((lote) => (
                  <Card key={lote.id} className="hover:shadow-md transition-all cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-medium">{lote.id}</CardTitle>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusClass(lote.estado)}`}>
                          {getStatusIcon(lote.estado)}
                          {getStatusText(lote.estado)}
                        </span>
                      </div>
                      <CardDescription>{lote.proveedor}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-gray-500">Fecha</p>
                        <p className="font-medium">{lote.fecha}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Productos</p>
                        <p className="font-medium">{lote.productos}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
          <TabsContent value="pendientes" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lotes
                .filter((lote) => lote.estado === "pendiente")
                .map((lote) => (
                  <Card key={lote.id} className="hover:shadow-md transition-all cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-medium">{lote.id}</CardTitle>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusClass(lote.estado)}`}>
                          {getStatusIcon(lote.estado)}
                          {getStatusText(lote.estado)}
                        </span>
                      </div>
                      <CardDescription>{lote.proveedor}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-gray-500">Fecha</p>
                        <p className="font-medium">{lote.fecha}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Productos</p>
                        <p className="font-medium">{lote.productos}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
          <TabsContent value="errores" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lotes
                .filter((lote) => lote.estado === "error")
                .map((lote) => (
                  <Card key={lote.id} className="hover:shadow-md transition-all cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-medium">{lote.id}</CardTitle>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusClass(lote.estado)}`}>
                          {getStatusIcon(lote.estado)}
                          {getStatusText(lote.estado)}
                        </span>
                      </div>
                      <CardDescription>{lote.proveedor}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-gray-500">Fecha</p>
                        <p className="font-medium">{lote.fecha}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Productos</p>
                        <p className="font-medium">{lote.productos}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AnalizarLotes;
