"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { removeAuthToken } from "@/lib/auth";
import { getCurrentUsername, isTokenValid } from "@/lib/jwt";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import ChirpCard from "@/components/ChirpCard";
import NewChirpForm from "@/components/NewChirpForm";
import { logger } from "@/lib/logger";

interface Chirp {
  id: number | string;
  content: string;
  author_username: string;
  created_at: string;
}

// іinterface for the mutation context, will be used to store the previous chirps state before mutation
interface MutationContext {
  previousChirps: Chirp[] | undefined; // Type for previousChirps
}

export default function HomePage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    //set the client state to true after the component mounts
    setIsClient(true);

    // check if the user is authenticated by validating the JWT token and set the isAuthenticated state
    const tokenIsValid = isTokenValid();
    setIsAuthenticated(tokenIsValid);

    if (!tokenIsValid) {
      logger.info(
        "User is not authenticated or token is invalid. Redirecting to login.",
        { context: "HomePage" }
      );
      router.push("/login");
    } else {
      logger.info("User is authenticated.", { context: "HomePage" });
    }
  }, [router]);

  // function to fetch chirps from the API
  const fetchChirps = async (): Promise<Chirp[]> => {
    logger.debug("Fetching chirps...", { context: "HomePage" });
    const response = await api.get("/api/chirps");
    logger.debug("Chirps fetched successfully.", {
      count: response.data.chirps.length,
      context: "HomePage",
    });
    return response.data.chirps;
  };

  // function to create a new chirp
  const createChirp = async (content: string): Promise<Chirp> => {
    logger.debug("Creating new chirp...", { content, context: "HomePage" });
    const response = await api.post("/api/chirps", { content });
    logger.info("Chirp created successfully.", {
      chirpId: response.data.chirp.id,
      context: "HomePage",
    });
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

  // useMutation for creating a new chirp
  const createChirpMutation = useMutation<
    Chirp,
    Error,
    string,
    MutationContext
  >({
    mutationFn: createChirp,
    onMutate: async (newChirpContent) => {
      logger.debug("Optimistically updating chirps list on mutation.", {
        newChirpContent,
        context: "HomePage",
      });
      await queryClient.cancelQueries({ queryKey: ["chirps"] });

      const previousChirps = queryClient.getQueryData<Chirp[]>(["chirps"]);

      // Optimistically update the chirps list (immediately show the new chirp in the UI before the server confirms it was created
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
        context: "HomePage",
      });
      if (context?.previousChirps) {
        queryClient.setQueryData(["chirps"], context.previousChirps);
      }
      alert(`Failed to publish chirp: ${err.message}`);
    },
    onSettled: () => {
      logger.debug("Invalidating chirps query after mutation settlement.", {
        context: "HomePage",
      });
      queryClient.invalidateQueries({ queryKey: ["chirps"] }); // Re-fetch chirps after mutation
    },
  });

  // Function to handle logout
  const handleLogout = () => {
    logger.info("User logging out.", { context: "HomePage" });
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
  if (isError) {
    logger.error("Error downloading chirps.", error, { context: "HomePage" });
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        Error downloading chirps: {error?.message}
      </div>
    );
  }

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
