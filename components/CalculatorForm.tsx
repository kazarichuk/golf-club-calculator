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

interface CalculatorFormProps {
  onSubmit: (input: UserInput) => void;
  isLoading: boolean;
}

export function CalculatorForm({ onSubmit, isLoading }: CalculatorFormProps) {
  const [userInput, setUserInput] = useState<UserInput>({
    handicap: 20,
    goal: 'Forgiveness',
    budget: 'Mid-range'
  });

  return (
    <Card className="w-full max-w-lg mx-auto">
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
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          size="lg" 
          onClick={() => onSubmit(userInput)}
          disabled={isLoading}
        >
          {isLoading ? 'Getting Recommendations...' : 'Get My Recommendations'}
        </Button>
      </CardFooter>
    </Card>
  );
}
