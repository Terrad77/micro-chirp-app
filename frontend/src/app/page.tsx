"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { removeAuthToken } from "@/lib/auth";
import { getCurrentUsername, isTokenValid } from "@/lib/jwt";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import ChirpCard from "@/components/ChirpCard";
import NewChirpForm from "@/components/NewChirpForm";

interface Chirp {
  id: number | string;
  content: string;
  author_username: string;
  created_at: string;
}

// іinterface for the mutation context
// This will be used to store the previous chirps state before mutation
interface MutationContext {
  previousChirps: Chirp[] | undefined; // Тип для previousChirps
}

export default function HomePage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Встановлюємо isClient, як тільки компонент монтується на клієнті
    setIsClient(true);

    // Перевіряємо токен і оновлюємо стан авторизації
    const tokenIsValid = isTokenValid();
    setIsAuthenticated(tokenIsValid);

    if (!tokenIsValid) {
      router.push("/login");
    }
  }, [router]);

  // function to fetch chirps from the API
  const fetchChirps = async (): Promise<Chirp[]> => {
    const response = await api.get("/api/chirps");
    return response.data.chirps;
  };

  // function to create a new chirp
  const createChirp = async (content: string): Promise<Chirp> => {
    const response = await api.post("/api/chirps", { content });
    return response.data.chirp;
  };

  const {
    data: chirps,
    isLoading,
    isError,
    error,
  } = useQuery<Chirp[], Error>({
    queryKey: ["chirps"],
    queryFn: fetchChirps,
    enabled: isClient && isAuthenticated,
  });

  // Вказуємо тип для context у useMutation: <TData, TError, TVariables, TContext>
  const createChirpMutation = useMutation<
    Chirp,
    Error,
    string,
    MutationContext
  >({
    mutationFn: createChirp,
    onMutate: async (newChirpContent) => {
      await queryClient.cancelQueries({ queryKey: ["chirps"] });

      const previousChirps = queryClient.getQueryData<Chirp[]>(["chirps"]);

      // Optimistically update the chirps list
      // This will immediately show the new chirp in the UI before the server confirms it was created
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
      console.error("Failed to create chirp:", err);
      if (context?.previousChirps) {
        queryClient.setQueryData(["chirps"], context.previousChirps);
      }
      alert(`Failed to publish chirp: ${err.message}`);
    },
    onSettled: (_data, _error, _variables, _context) => {
      queryClient.invalidateQueries({ queryKey: ["chirps"] });
    },
  });

  // Function to handle logout
  const handleLogout = () => {
    removeAuthToken();
    router.push("/login");
  };

  if (!isClient || !isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-700">
        Downloading...
      </div>
    );
  }

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-700">
        Downloading chirps...
      </div>
    );
  if (isError)
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        Error downloading chirps: {error?.message}
      </div>
    );

  return (
    <div className="container mx-auto p-4 max-w-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-500">Main Feed</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200"
        >
          Logout
        </button>
      </div>

      {isAuthenticated && (
        <NewChirpForm
          onSubmit={createChirpMutation.mutate}
          isPending={createChirpMutation.isPending}
        />
      )}

      <div className="mt-8 space-y-4">
        {chirps && chirps.length > 0 ? (
          chirps.map((chirp) => <ChirpCard key={chirp.id} chirp={chirp} />)
        ) : (
          <p className="text-center text-gray-500">
            No chirps yet. Be the first!
          </p>
        )}
      </div>
    </div>
  );
}
