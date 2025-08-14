import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useEffect, useState } from 'react';

interface LoadingIndicatorProps {
  message?: string;
  progress: number;
}

const LoadingIndicator = ({ 
  message = "Cargando datos...", 
  progress 
}: LoadingIndicatorProps) => {
  const [showMessage, setShowMessage] = useState(false);
  
  // Mostrar mensaje de espera después de 3 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMessage(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col justify-center items-center h-60 space-y-6">
      <Loader2 className="h-12 w-12 text-[#8CC63F] animate-spin" />
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-2">{message}</p>
        {showMessage && (
          <p className="text-xs text-gray-400 animate-fade-in">
            Esto puede tomar unos momentos, estamos procesando la información
          </p>
        )}
      </div>
      <div className="w-full max-w-md">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-right mt-1 text-gray-400">{Math.min(progress, 100)}%</p>
      </div>
    </div>
  );
};

export default LoadingIndicator;
