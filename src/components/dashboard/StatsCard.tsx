
import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  description: string;
  value: string | number;
  isLoading: boolean;
  color?: string;
  icon?: ReactNode;
}

const StatsCard = ({ 
  title, 
  description, 
  value, 
  isLoading, 
  color = "bg-white", 
  icon 
}: StatsCardProps) => {
  return (
    <Card className={`${color} border transition-all duration-200 hover:shadow-md`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          {icon && <div className="p-2 rounded-full">{icon}</div>}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 flex items-center space-x-3">
            <Loader2 className="h-6 w-6 text-[#8CC63F] animate-spin" />
            <span className="text-sm text-gray-500">Cargando...</span>
          </div>
        ) : (
          <p className="text-3xl font-bold">{value}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
