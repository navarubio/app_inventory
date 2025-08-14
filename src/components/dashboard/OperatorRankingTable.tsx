
import { Trophy, Medal, Award, Star, User } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface OperadorData {
  operador: string;
  recordsByUser: number;
  porcentajeCarga: number;
  puntuacion: number;
}

interface OperatorRankingTableProps {
  operadores: OperadorData[];
}

const OperatorRankingTable = ({ operadores }: OperatorRankingTableProps) => {
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
        return <User className="text-gray-400" size={20} />;
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
          <tr className="bg-[#8CC63F] text-white">
            <th className="px-4 py-3 text-left w-16">Posición</th>
            <th className="px-4 py-3 text-left">Operador</th>
            <th className="px-4 py-3 text-right">Cargas</th>
            <th className="px-4 py-3 text-right">Porcentaje</th>
            <th className="px-4 py-3 text-right">Puntuación</th>
            <th className="px-4 py-3 text-center">Rendimiento</th>
          </tr>
        </thead>
        <tbody>
          {operadores.map((operador, index) => (
            <tr 
              key={operador.operador}
              className={`border-b hover:bg-gray-50 transition-colors ${getRankColor(index)}`}
            >
              <td className="px-4 py-4 text-center">
                <div className="flex justify-center">
                  {renderRankIcon(index)}
                </div>
              </td>
              <td className="px-4 py-4 font-medium">
                {operador.operador}
              </td>
              <td className="px-4 py-4 text-right font-semibold">
                {operador.recordsByUser}
              </td>
              <td className="px-4 py-4 text-right">
                {operador.porcentajeCarga.toFixed(2)}%
              </td>
              <td className="px-4 py-4 text-right">
                {operador.puntuacion}
              </td>
              <td className="px-4 py-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      index < 3 ? 'bg-green-500' : 
                      index < 6 ? 'bg-blue-500' : 
                      index < 9 ? 'bg-yellow-500' : 'bg-gray-500'
                    }`} 
                    style={{ width: `${operador.porcentajeCarga}%` }}
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

export default OperatorRankingTable;
