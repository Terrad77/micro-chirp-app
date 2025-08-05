import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { getCurrentUsername } from "@/lib/jwt";
import { logger } from "@/lib/logger";
import { type Chirp } from "./useChirps";

// Інтерфейс для контексту мутації, використовується для збереження попереднього стану
interface MutationContext {
  previousChirps: Chirp[] | undefined;
}

/**
 * Хук для створення нового чирпу.
 * Використовує useMutation від React Query для відправки запитів,
 * оптимістичних оновлень та обробки помилок.
 * @returns Результат useMutation та функція для мутації.
 */
export const useCreateChirp = () => {
  const queryClient = useQueryClient();

  // Функція для створення чирпу. Винесена з компонента HomePage.
  const createChirp = async (content: string): Promise<Chirp> => {
    logger.debug("Creating new chirp...", {
      content,
      context: "useCreateChirp",
    });
    const response = await api.post("/api/chirps", { content });
    logger.info("Chirp created successfully.", {
      chirpId: response.data.chirp.id,
      context: "useCreateChirp",
    });
    return response.data.chirp;
  };

  return useMutation<Chirp, Error, string, MutationContext>({
    mutationFn: createChirp,
    onMutate: async (newChirpContent) => {
      logger.debug("Optimistically updating chirps list on mutation.", {
        newChirpContent,
        context: "useCreateChirp",
      });
      await queryClient.cancelQueries({ queryKey: ["chirps"] });
      const previousChirps = queryClient.getQueryData<Chirp[]>(["chirps"]);
      queryClient.setQueryData(["chirps"], (oldChirps?: Chirp[]) => {
        const optimisticChirp: Chirp = {
          id: `optimistic-${Date.now()}`,
          content: newChirpContent,
          author_username: getCurrentUsername() || "Unknown User",
          created_at: new Date().toISOString(),
        };
        return [optimisticChirp, ...(oldChirps || [])];
      });
      return { previousChirps };
    },
    onError: (err, newChirpContent, context) => {
      logger.error("Failed to create chirp.", err, {
        newChirpContent,
        context: "useCreateChirp",
      });
      if (context?.previousChirps) {
        queryClient.setQueryData(["chirps"], context.previousChirps);
      }

      logger.error("Failed to publish chirp.", err);
    },
    onSettled: () => {
      logger.debug("Invalidating chirps query after mutation settlement.", {
        context: "useCreateChirp",
      });
      queryClient.invalidateQueries({ queryKey: ["chirps"] });
    },
  });
};
