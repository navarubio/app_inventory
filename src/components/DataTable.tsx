
import { useState } from "react";
import type { InvoiceDetail } from "@/utils/xmlParser";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface DataTableProps {
  data: InvoiceDetail[];
  onDataUpdate: (updatedData: InvoiceDetail[]) => void;
}

export const DataTable = ({ data, onDataUpdate }: DataTableProps) => {
  const handleUpdate = (index: number, field: keyof InvoiceDetail, value: string) => {
    const newData = [...data];
    const updatedItem = { ...newData[index], [field]: value };

    // Validación de fechas
    if (field === "fechaVencimiento" && updatedItem.fechaFabricacion) {
      if (updatedItem.fechaVencimiento <= updatedItem.fechaFabricacion) {
        toast.error("La fecha de vencimiento debe ser posterior a la fecha de fabricación");
        return;
      }
    }

    // Validación de fecha de fabricación
    if (field === "fechaFabricacion") {
      const today = new Date();
      const fabricationDate = new Date(value);
      today.setHours(0, 0, 0, 0);
      
      if (fabricationDate > today) {
        toast.error("La fecha de fabricación no puede ser mayor a la fecha actual");
        return;
      }
    }

    newData[index] = updatedItem;
    onDataUpdate(newData);
  };

  const isRowComplete = (item: InvoiceDetail) => {
    return item.lote && item.fechaFabricacion && item.fechaVencimiento;
  };

  return (
    <div className="overflow-x-auto rounded-lg border animate-fadeIn">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-[#8CC63F]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-32">Código Principal</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-32">Código Auxiliar</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider flex-1">Descripción</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-24">Cantidad</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-32">Precio Unitario</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-32">Número de Lote</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-36">Fecha Fabricación</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-36">Fecha Vencimiento</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr 
              key={index} 
              className={`transition-colors ${
                isRowComplete(item) ? "bg-[#F2FCE2]" : "hover:bg-gray-50"
              }`}
            >
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.codigoPrincipal}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.codigoAuxiliar}</td>
              <td className="px-4 py-4 text-sm text-gray-900">{item.descripcion}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.cantidad}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">${item.precioUnitario}</td>
              <td className="px-4 py-4 whitespace-nowrap">
                <Input
                  value={item.lote || ""}
                  onChange={(e) => handleUpdate(index, "lote", e.target.value)}
                  placeholder="Ingrese lote"
                  className="max-w-[120px]"
                />
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <Input
                  type="month"
                  value={item.fechaFabricacion || ""}
                  onChange={(e) => handleUpdate(index, "fechaFabricacion", e.target.value)}
                  className="max-w-[130px]"
                />
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <Input
                  type="month"
                  value={item.fechaVencimiento || ""}
                  onChange={(e) => handleUpdate(index, "fechaVencimiento", e.target.value)}
                  className="max-w-[130px] text-[#ea384c]"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
