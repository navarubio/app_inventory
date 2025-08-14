import { SateliteView } from "@/types/analizar-carga";
import * as XLSX from 'xlsx';

export const sendEmailReport = async (
  to: string,
  message: string,
  data: SateliteView[]
): Promise<void> => {
  try {
    // Preparar los datos para Excel
    const excelData = data.map(item => ({
      Local: item.local,
      Laboratorio: item.laboratorio,
      Producto: item.product,
      Lote: item.numerolote,
      Cajas: item.cantidadCajas,
      Unidades: item.unidades,
      'Fecha Vencimiento': item.fechavencimiento,
      Estado: item.numerolote.includes('_ERR') ? 'Error' : 'OK'
    }));

    // Crear el archivo Excel
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");

    // Convertir a buffer y luego a base64 directamente
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });

    // Crear el mensaje HTML simple
    const htmlMessage = `
      <div style="font-family:Arial,sans-serif">
        <h2 style="color:#1B365D">Reporte de Análisis de Carga</h2>
        <p>${message}</p>
        <p>Se adjunta archivo Excel con el detalle del reporte.</p>
        <p style="color:#666;font-size:12px">
          Total de registros: ${data.length}<br>
          Registros con error: ${data.filter(item => item.numerolote.includes('_ERR')).length}
        </p>
      </div>
    `;

    // Enviar la petición al servidor con el archivo adjunto en base64
    const response = await fetch('http://10.10.10.251:3001/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject: 'Reporte de Análisis de Carga',
        message: htmlMessage,
        attachments: [{
          filename: `reporte_analisis_carga_${new Date().toISOString().split('T')[0]}.xlsx`,
          content: excelBuffer,
          encoding: 'base64',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }]
      }),
    });

    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message;
      } catch {
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage || 'Error al enviar el correo');
    }
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    throw error;
  }
};