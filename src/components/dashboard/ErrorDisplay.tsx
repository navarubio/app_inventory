
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface ErrorDisplayProps {
  errorDetails: string | null;
  onRetry: () => void;
  isRetrying: boolean;
}

const ErrorDisplay = ({ errorDetails, onRetry, isRetrying }: ErrorDisplayProps) => {
  // Notificación automática de error
  useEffect(() => {
    if (errorDetails) {
      toast.error("Error al cargar los datos", {
        description: "Se produjo un error al obtener la información. Puedes intentar nuevamente.",
        duration: 5000,
      });
    }
  }, [errorDetails]);

  const handleRetry = () => {
    toast.info("Reintentando cargar los datos...");
    onRetry();
  };

  return (
    <div className="flex flex-col items-center text-red-500 p-6 space-y-4 animate-fade-in">
      <AlertCircle size={48} />
      <div className="text-center">
        <p className="text-lg font-semibold mb-2">Error al cargar los datos</p>
        {errorDetails && (
          <div className="bg-red-50 p-4 rounded-lg text-sm text-red-800 mt-2 mb-4 max-w-2xl mx-auto overflow-auto">
            <p className="font-medium mb-1">Detalles del error:</p>
            <pre className="whitespace-pre-wrap break-words">{errorDetails}</pre>
            <p className="mt-2 text-xs text-red-600">
              Es probable que este error esté relacionado con CORS o con la disponibilidad del servidor. 
              Si estás trabajando localmente, asegúrate de que el proxy esté configurado correctamente en vite.config.ts.
            </p>
          </div>
        )}
      </div>
      <Button 
        onClick={handleRetry} 
        variant="outline" 
        className="mt-4 flex items-center space-x-2"
        disabled={isRetrying}
      >
        <RefreshCw size={16} className={isRetrying ? "animate-spin" : ""} />
        <span>{isRetrying ? "Reintentando..." : "Reintentar"}</span>
      </Button>
    </div>
  );
};

export default ErrorDisplay;
