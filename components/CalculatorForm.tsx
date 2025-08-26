// /components/CalculatorForm.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { UserInput } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface CalculatorFormProps {
  onSubmit: (input: UserInput) => void;
  isLoading: boolean;
}

export function CalculatorForm({ onSubmit, isLoading }: CalculatorFormProps) {
  const [userInput, setUserInput] = useState<UserInput>({
    handicap: 20,
    goal: 'Forgiveness',
    budget: 'Mid-range',
    preferredBrand: '',
    age: undefined,
    swingSpeed: undefined
  });

  return (
    <Card id="calculator-form" className="w-full max-w-lg mx-auto relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing your preferences...</p>
          </div>
        </div>
      )}
      <CardHeader>
        <CardTitle>Golf Club Recommendation Calculator</CardTitle>
        <CardDescription>
          Answer a few questions to get your personalized iron set recommendation.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {/* Handicap Section */}
        <div className="grid gap-2">
          <Label htmlFor="handicap">What is your current Handicap?</Label>
          <div className="flex items-center gap-4">
            <Slider
              id="handicap"
              value={[userInput.handicap]}
              onValueChange={(value) => setUserInput(prev => ({ ...prev, handicap: value[0] }))}
              max={30}
              step={1}
              className="flex-1"
            />
            <span className="font-bold text-lg w-10 text-center rounded-md border p-2">
              {userInput.handicap}
            </span>
          </div>
        </div>

        {/* Goal Section */}
        <div className="grid gap-2">
          <Label>What is your primary goal?</Label>
          <RadioGroup value={userInput.goal} onValueChange={(value) => setUserInput(prev => ({ ...prev, goal: value as UserInput['goal'] }))} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <RadioGroupItem value="Forgiveness" id="g-forgiveness" className="peer sr-only" />
              <Label
                htmlFor="g-forgiveness"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                Forgiveness
              </Label>
            </div>
            <div>
              <RadioGroupItem value="Distance" id="g-distance" className="peer sr-only" />
              <Label
                htmlFor="g-distance"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                Distance
              </Label>
            </div>
            <div>
              <RadioGroupItem value="Accuracy" id="g-accuracy" className="peer sr-only" />
              <Label
                htmlFor="g-accuracy"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                Accuracy
              </Label>
            </div>
            <div>
              <RadioGroupItem value="Feel" id="g-feel" className="peer sr-only" />
              <Label
                htmlFor="g-feel"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                Feel
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Budget Section */}
        <div className="grid gap-2">
          <Label>What is your budget?</Label>
          <RadioGroup value={userInput.budget} onValueChange={(value) => setUserInput(prev => ({ ...prev, budget: value as UserInput['budget'] }))} className="grid grid-cols-3 gap-4">
            <div>
              <RadioGroupItem value="Budget" id="b-budget" className="peer sr-only" />
              <Label
                htmlFor="b-budget"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                Budget
              </Label>
            </div>
            <div>
              <RadioGroupItem value="Mid-range" id="b-mid-range" className="peer sr-only" />
              <Label
                htmlFor="b-mid-range"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                Mid-Range
              </Label>
            </div>
            <div>
              <RadioGroupItem value="Premium" id="b-premium" className="peer sr-only" />
              <Label
                htmlFor="b-premium"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                Premium
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Optional Section */}
        <hr className="my-4" />
        <div className="grid gap-4">
          <h3 className="text-lg font-semibold">Optional Information</h3>
          
          <div className="grid gap-2">
            <Label htmlFor="preferredBrand">Preferred Brand (optional)</Label>
            <input
              type="text"
              id="preferredBrand"
              value={userInput.preferredBrand || ''}
              onChange={(e) => setUserInput(prev => ({ ...prev, preferredBrand: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="e.g., TaylorMade, Callaway, Titleist"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="age">Age (optional)</Label>
            <input
              type="number"
              id="age"
              value={userInput.age || ''}
              onChange={(e) => setUserInput(prev => ({ ...prev, age: e.target.value ? parseInt(e.target.value) : undefined }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Your age"
              min="1"
              max="120"
            />
          </div>

          <div className="grid gap-2">
            <Label>What does your Driver swing feel like?</Label>
            <RadioGroup value={userInput.swingSpeed} onValueChange={(value) => setUserInput(prev => ({ ...prev, swingSpeed: value as UserInput['swingSpeed'] }))} className="grid grid-cols-2 gap-4">
              <div>
                <RadioGroupItem value="Slow" id="s-slow" className="peer sr-only" />
                <Label
                  htmlFor="s-slow"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  Slow / Deliberate
                </Label>
              </div>
              <div>
                <RadioGroupItem value="Average" id="s-average" className="peer sr-only" />
                <Label
                  htmlFor="s-average"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  Average / Smooth
                </Label>
              </div>
              <div>
                <RadioGroupItem value="Fast" id="s-fast" className="peer sr-only" />
                <Label
                  htmlFor="s-fast"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  Fast / Aggressive
                </Label>
              </div>
              <div>
                <RadioGroupItem value="Very Fast" id="s-very-fast" className="peer sr-only" />
                <Label
                  htmlFor="s-very-fast"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  Very Fast / Powerful
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          size="lg" 
          onClick={() => onSubmit(userInput)}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Getting Recommendations...
            </>
          ) : (
            'Get My Recommendations'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
