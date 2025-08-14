
import { Trophy, Medal, Award, Star, Store } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface LocalData {
  localName: string;
  recordsByLocal: number;
  porcentajeCarga: number;
  puntuacion: number;
}

interface LocalRankingTableProps {
  locales: LocalData[];
}

const LocalRankingTable = ({ locales }: LocalRankingTableProps) => {
  // Función para renderizar el ícono según la posición
  const renderRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="text-yellow-500" size={24} />;
      case 1:
        return <Medal className="text-gray-400" size={24} />;
      case 2:
        return <Medal className="text-amber-600" size={24} />;
      case 3:
        return <Award className="text-blue-500" size={24} />;
      case 4:
        return <Star className="text-purple-500" size={24} />;
      default:
        return <Store className="text-gray-400" size={20} />;
    }
  };

  // Función para obtener la clase de color según la posición
  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return "bg-yellow-50 border-l-4 border-yellow-500";
      case 1:
        return "bg-gray-50 border-l-4 border-gray-400";
      case 2:
        return "bg-amber-50 border-l-4 border-amber-600";
      case 3:
        return "bg-blue-50 border-l-4 border-blue-500";
      case 4:
        return "bg-purple-50 border-l-4 border-purple-500";
      default:
        return "";
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#1B365D] text-white">
            <th className="px-4 py-3 text-left w-16">Posición</th>
            <th className="px-4 py-3 text-left">Local</th>
            <th className="px-4 py-3 text-right">Cargas</th>
            <th className="px-4 py-3 text-right">Porcentaje</th>
            <th className="px-4 py-3 text-right">Puntuación</th>
            <th className="px-4 py-3 text-center">Rendimiento</th>
          </tr>
        </thead>
        <tbody>
          {locales.map((local, index) => (
            <tr 
              key={local.localName}
              className={`border-b hover:bg-gray-50 transition-colors ${getRankColor(index)}`}
            >
              <td className="px-4 py-4 text-center">
                <div className="flex justify-center">
                  {renderRankIcon(index)}
                </div>
              </td>
              <td className="px-4 py-4 font-medium">
                {local.localName}
              </td>
              <td className="px-4 py-4 text-right font-semibold">
                {local.recordsByLocal}
              </td>
              <td className="px-4 py-4 text-right">
                {local.porcentajeCarga.toFixed(2)}%
              </td>
              <td className="px-4 py-4 text-right">
                {local.puntuacion}
              </td>
              <td className="px-4 py-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      index < 3 ? 'bg-green-500' : 
                      index < 5 ? 'bg-blue-500' : 
                      index < 7 ? 'bg-yellow-500' : 'bg-gray-500'
                    }`} 
                    style={{ width: `${local.porcentajeCarga}%` }}
                  ></div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LocalRankingTable;
