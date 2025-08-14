// /components/ResultsDisplay.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RecommendationResult } from "@/lib/types";

interface ResultsDisplayProps {
  results: RecommendationResult[];
}

export function ResultsDisplay({ results }: ResultsDisplayProps) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold mb-6 text-center">Your Top Recommendations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.length === 0 ? (
          <p className="text-center text-muted-foreground col-span-3">Your recommendations will appear here.</p>
        ) : (
          results.map((club) => (
            <Card key={club.id}>
              <CardHeader>
                <CardTitle>{club.model}</CardTitle>
                <CardDescription>{club.brand}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Key strengths: {club.keyStrengths.join(', ')}</p>
                {club.explanation && (
                  <p className="mt-2 text-sm text-muted-foreground">{club.explanation}</p>
                )}
              </CardContent>
              <CardFooter>
                <Button>View Details</Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
