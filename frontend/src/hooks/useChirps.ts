import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { logger } from "@/lib/logger";

// Інтерфейс для даних чирпа
export interface Chirp {
  id: number | string;
  content: string;
  author_username: string;
  created_at: string;
}

/**
 * Хук для отримання всіх чирпів з API.
 * Використовує useQuery від React Query для управління станом завантаження,
 * кешування та синхронізації з сервером.
 * @param enabled Чи повинен хук бути активований (наприклад, після успішної автентифікації).
 * @returns Результат useQuery.
 */
export const useChirps = (enabled: boolean) => {
  // Функція для отримання чирпів. Винесена з компонента HomePage.
  const fetchChirps = async (): Promise<Chirp[]> => {
    logger.debug("Fetching chirps...", { context: "useChirps" });
    const response = await api.get("/api/chirps");
    logger.debug("Chirps fetched successfully.", {
      count: response.data.chirps.length,
      context: "useChirps",
    });
    return response.data.chirps;
  };

  return useQuery<Chirp[], Error>({
    queryKey: ["chirps"],
    queryFn: fetchChirps,
    enabled,
    staleTime: 1000 * 60, // Кешувати дані на 1 хвилину
    refetchOnWindowFocus: true, // Перезавантажувати при фокусі вікна
  });
};
