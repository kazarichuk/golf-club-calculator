"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecommendationResult } from "@/lib/types";
import { Star, TrendingUp, DollarSign, Crown } from "lucide-react";
import Image from "next/image";

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
            <Card key={club.id} className={`relative flex flex-col h-full ${index === 0 ? 'ring-2 ring-primary' : ''}`}>
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
                    {club.approximatePrice !== undefined && club.approximatePrice !== null && club.approximatePrice > 0 && (
                      <div className="text-2xl font-bold text-primary pt-2">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 0,
                        }).format(club.approximatePrice)}
                      </div>
                    )}
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
                    <div className="w-full h-48 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
                      <Image
                        src={`/api/image-proxy?url=${encodeURIComponent(club.imageUrl)}`}
                        alt={`${club.brand} ${club.model}`}
                        width={200}
                        height={150}
                        className="object-contain max-w-full max-h-full"
                        onError={(e) => {
                          console.log(`Image failed to load for ${club.brand} ${club.model}:`, club.imageUrl);
                          // Fallback to a better golf club icon
                          e.currentTarget.src = '/golf-club-placeholder.svg';
                        }}
                        onLoad={() => {
                          console.log(`Image loaded successfully for ${club.brand} ${club.model}`);
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto space-y-3 pr-2">
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
                </div>
              </CardContent>
              
              {/* Match Score positioned at bottom with 12px margin */}
              <div className="px-6 pb-3 mt-auto">
                <div className="w-full text-center text-xs text-muted-foreground">
                  Match Score: {club.matchScore}%
                </div>
              </div>
              
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    // Construct search query for golf stores selling this specific club
                    const searchQuery = `golf stores selling ${club.brand} ${club.model}`;
                    
                    // URL-encode the query to make it safe for URLs
                    const encodedQuery = encodeURIComponent(searchQuery);
                    
                    // Create Google Maps URL with the search query
                    const mapsUrl = `https://www.google.com/maps/search/${encodedQuery}`;
                    
                    // Open Google Maps in a new browser tab
                    window.open(mapsUrl, '_blank');
                  }}
                >
                  Find a Store
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
      
      {/* 2025 Banner - Only show when there are results */}
      {results.length > 0 && (
        <div className="mt-12 mb-8">
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <a 
                href="https://procaddie.ai/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block transition-transform hover:scale-105 duration-300"
              >
                <Image
                  src="/banner-svg-2025.svg"
                  alt="2025 Golf Season - Click to visit ProCaddie"
                  width={800}
                  height={502}
                  className="w-full h-auto rounded-lg shadow-lg cursor-pointer"
                  priority
                />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
