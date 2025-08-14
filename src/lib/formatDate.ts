
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function formatDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, "dd/MM/yyyy", { locale: es });
  } catch (error) {
    return dateString;
  }
}
