// /app/page.tsx
"use client";

import { useState } from "react";
import { CalculatorForm } from "@/components/CalculatorForm";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RecommendationResult, UserInput } from "@/lib/types";

export default function Home() {
  const [results, setResults] = useState<RecommendationResult[]>([]);
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
    <>
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            AI-Powered Golf Iron Recommendation Calculator
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Get <strong>instant, personalized golf iron recommendations</strong> powered by advanced AI technology. No waiting, no appointments, no fees. Simply answer a few questions and receive your perfect iron set match in seconds - completely <strong>FREE</strong>.
          </p>
          
          {/* Key Benefits Highlight */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary/10 p-4 rounded-lg">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-semibold text-sm">Instant Results</h3>
              <p className="text-xs text-muted-foreground">Get recommendations in seconds, not hours</p>
            </div>
            <div className="bg-primary/10 p-4 rounded-lg">
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-semibold text-sm">AI-Powered</h3>
              <p className="text-xs text-muted-foreground">Advanced algorithms analyze your game</p>
            </div>
            <div className="bg-primary/10 p-4 rounded-lg">
              <div className="text-2xl mb-2">💯</div>
              <h3 className="font-semibold text-sm">100% Free</h3>
              <p className="text-xs text-muted-foreground">No hidden costs or subscriptions</p>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <CalculatorForm onSubmit={handleGetRecommendations} isLoading={isLoading} />
        </div>
        
        {error && (
          <div className="text-red-500 text-center mt-4">
            {error}
          </div>
        )}
        <ResultsDisplay results={results} />

        {/* SEO-Rich Content Section */}
        <section className="mt-16 max-w-4xl mx-auto">
          <div className="prose prose-lg mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Get Instant, Free Golf Iron Recommendations Powered by AI
            </h2>
            
            <div className="grid lg:grid-cols-2 gap-12 mb-16">
              {/* Why Choose Section */}
              <div className="bg-black p-8 rounded-2xl border border-gray-800 shadow-2xl">
                <h3 className="text-2xl font-bold mb-6 text-center lg:text-left text-white">
                  Why Choose Our Free AI Calculator?
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 bg-gray-900 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <strong className="text-lg text-white">Lightning Fast</strong>
                      <p className="text-gray-300 mt-1">Get your personalized recommendations in under 30 seconds</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 bg-gray-900 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors">
                    <span className="text-2xl">🤖</span>
                    <div>
                      <strong className="text-lg text-white">Advanced AI Technology</strong>
                      <p className="text-gray-300 mt-1">Our algorithms analyze thousands of data points to find your perfect match</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 bg-gray-900 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors">
                    <span className="text-2xl">💯</span>
                    <div>
                      <strong className="text-lg text-white">Completely Free</strong>
                      <p className="text-gray-300 mt-1">No hidden fees, no subscriptions, no strings attached</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 bg-gray-900 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <strong className="text-lg text-white">Highly Accurate</strong>
                      <p className="text-gray-300 mt-1">Based on real player data and professional fitting principles</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* How It Works Section */}
              <div className="bg-black p-8 rounded-2xl border border-gray-800 shadow-2xl">
                <h3 className="text-2xl font-bold mb-6 text-center lg:text-left text-white">
                  How Our Golf Iron Selector Works
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 bg-gray-900 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                    <div>
                      <strong className="text-lg text-white">Answer Simple Questions</strong>
                      <p className="text-gray-300 mt-1">Tell us about your handicap, goals, and budget</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 bg-gray-900 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                    <div>
                      <strong className="text-lg text-white">AI Analysis</strong>
                      <p className="text-gray-300 mt-1">Our system analyzes your profile against our comprehensive database</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 bg-gray-900 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                    <div>
                      <strong className="text-lg text-white">Get Matched</strong>
                      <p className="text-gray-300 mt-1">Receive 3 perfectly matched iron set recommendations</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 bg-gray-900 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
                    <div>
                      <strong className="text-lg text-white">Shop Confidently</strong>
                      <p className="text-gray-300 mt-1">Each recommendation includes detailed explanations and pricing</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg mb-12">
              <h3 className="text-2xl font-semibold mb-4">Golf Club Buying Guide: What to Consider</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Skill Level & Handicap</h4>
                  <p className="text-sm text-muted-foreground">
                    Beginners need forgiving clubs, while low handicappers can benefit from workability and feel.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Swing Speed & Tempo</h4>
                  <p className="text-sm text-muted-foreground">
                    Faster swings require stiffer shafts, while slower swings benefit from lighter, more flexible options.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Budget Considerations</h4>
                  <p className="text-sm text-muted-foreground">
                    Quality clubs are available at every price point. Our tool helps you find the best value for your budget.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-12">
              <h3 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">How accurate are the golf club recommendations?</h4>
                  <p className="text-muted-foreground">
                    Our advanced AI system analyzes thousands of player profiles and club performance data to provide highly accurate recommendations tailored to your specific needs and playing style. And it's completely free!
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">What if I don't know my exact handicap?</h4>
                  <p className="text-muted-foreground">
                    No problem! Use our slider to estimate your handicap based on your typical scores. The calculator will still provide excellent recommendations even with approximate values.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Can I get recommendations for specific brands?</h4>
                  <p className="text-muted-foreground">
                    Yes! You can specify your preferred brand in the optional section, and our system will prioritize clubs from that manufacturer while still considering your other requirements.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Is this really free? What's the catch?</h4>
                  <p className="text-muted-foreground">
                    Yes, it's 100% free! No hidden fees, no subscriptions, no credit card required. We believe every golfer deserves access to professional-quality club recommendations without the high cost of traditional fitting sessions.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">How often should I update my golf clubs?</h4>
                  <p className="text-muted-foreground">
                    Most golfers benefit from new clubs every 3-5 years, depending on usage and technology improvements. Our calculator helps you determine if it's time for an upgrade.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center bg-primary/10 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Ready to Get Your Free AI Recommendation?</h3>
              <p className="text-muted-foreground mb-4">
                Join thousands of golfers who have discovered their perfect clubs in seconds - completely free!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button 
                  onClick={() => document.getElementById('calculator-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                  ⚡ Get Instant Results - FREE
                </button>
                <p className="text-xs text-muted-foreground">No registration required • Takes 30 seconds</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
