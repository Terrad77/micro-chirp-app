"use client";

import { removeAuthToken } from "@/lib/auth";
import { isTokenValid } from "@/lib/jwt";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import ChirpCard from "@/components/ChirpCard";
import NewChirpForm from "@/components/NewChirpForm";
import { logger } from "@/lib/logger";
import { useChirps } from "@/hooks/useChirps";
import { useCreateChirp } from "@/hooks/useCreateChirp";

export default function HomePage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsClient(true);
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

  // Використання кастомних хуків React Query
  const {
    data: chirps,
    isLoading,
    isError,
    error,
  } = useChirps(isClient && isAuthenticated);

  const { mutate: createChirpMutation, isPending: isCreatingChirp } =
    useCreateChirp();

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
          onSubmit={createChirpMutation}
          isPending={isCreatingChirp}
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
