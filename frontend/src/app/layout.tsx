"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Імпортуємо React Query
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"; // optional, for development only

//initialize fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// create QueryClient outside of component, for preventing re-creation on every render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // fresh data for 5 minutes
      refetchOnWindowFocus: false, // Do not refetch data on window focus (optional)
    },
  },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {" "}
        <QueryClientProvider client={queryClient}>
          {children}
          {/* React Query Devtools for debugging, initialIsOpen={false} will be closed by default */}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  );
}
