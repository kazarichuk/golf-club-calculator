// /app/page.tsx
"use client";

import { useState } from "react";
import { CalculatorForm } from "@/components/CalculatorForm";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { Club, UserInput } from "@/lib/types";

export default function Home() {
  const [results, setResults] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetRecommendations = async (input: UserInput) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const recommendations = await response.json();
      setResults(recommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-12">
      <CalculatorForm onSubmit={handleGetRecommendations} isLoading={isLoading} />
      {error && (
        <div className="text-red-500 text-center mt-4">
          {error}
        </div>
      )}
      <ResultsDisplay results={results} />
    </main>
  );
}
