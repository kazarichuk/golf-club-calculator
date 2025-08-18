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
import { Badge } from "@/components/ui/badge";
import { RecommendationResult } from "@/lib/types";
import { Star, TrendingUp, DollarSign, Crown } from "lucide-react";

interface ResultsDisplayProps {
  results: RecommendationResult[];
}

const getBadgeIcon = (badge?: string) => {
  switch (badge) {
    case 'Best Match': return <Crown className="h-3 w-3" />;
    case 'Top Pick': return <Star className="h-3 w-3" />;
    case 'Great Value': return <DollarSign className="h-3 w-3" />;
    case 'Premium Choice': return <TrendingUp className="h-3 w-3" />;
    default: return null;
  }
};

const getBadgeVariant = (badge?: string) => {
  switch (badge) {
    case 'Best Match': return 'default';
    case 'Top Pick': return 'secondary';
    case 'Great Value': return 'outline';
    case 'Premium Choice': return 'destructive';
    default: return 'outline';
  }
};

export function ResultsDisplay({ results }: ResultsDisplayProps) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold mb-6 text-center">Your Top Recommendations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.length === 0 ? (
          <p className="text-center text-muted-foreground col-span-3">
            Your recommendations will appear here.
          </p>
        ) : (
          results.map((club, index) => (
            <Card key={club.id} className={`relative ${index === 0 ? 'ring-2 ring-primary' : ''}`}>
              {club.badge && (
                <div className="absolute -top-2 -right-2 z-10">
                  <Badge variant={getBadgeVariant(club.badge)} className="flex items-center gap-1">
                    {getBadgeIcon(club.badge)}
                    {club.badge}
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{club.model}</CardTitle>
                    <CardDescription className="text-sm">{club.brand}</CardDescription>
                  </div>
                  {club.rank && (
                    <Badge variant="outline" className="text-xs">
                      #{club.rank}
                    </Badge>
                  )}
                </div>
                
                {/* Golf Club Image */}
                {club.imageUrl && (
                  <div className="mt-4 flex justify-center">
                    <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
                      <img
                        src={club.imageUrl}
                        alt={`${club.brand} ${club.model}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          e.currentTarget.src = '/images/placeholder.png';
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Category:</span>
                  <Badge variant="secondary" className="text-xs">
                    {club.category}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-1">Key strengths:</p>
                  <div className="flex flex-wrap gap-1">
                    {club.keyStrengths.map((strength) => (
                      <Badge key={strength} variant="outline" className="text-xs">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {club.explanation && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {club.explanation}
                    </p>
                  </div>
                )}
              </CardContent>
              
              {/* Removed buttons - keeping footer for spacing */}
              <CardFooter className="pt-0">
                <div className="w-full text-center text-xs text-muted-foreground">
                  Match Score: {club.matchScore}%
                </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
