import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Quiz({ question, options, correctIndex }) {
  const [selected, setSelected] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  const handleSelect = (index) => {
    if (selected !== null) return;
    setSelected(index);
    setIsCorrect(index === correctIndex);
  };

  const handleRetry = () => {
    setSelected(null);
    setIsCorrect(null);
  };

  return (
    <Card className="mt-8 border-indigo-100 bg-indigo-50/50 overflow-hidden">
      <CardHeader className="pb-3 bg-indigo-100/50">
        <CardTitle className="text-lg flex items-center gap-2 text-indigo-900">
          <HelpCircle className="w-5 h-5 text-indigo-600" />
          Check Your Understanding
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="mb-6 font-medium text-slate-900 text-lg">{question}</p>
        <div className="space-y-3">
          {options.map((option, idx) => (
            <Button
              key={idx}
              variant="outline"
              className={`w-full justify-start text-left h-auto py-4 px-4 relative transition-all ${
                selected === idx
                  ? isCorrect
                    ? "bg-green-50 border-green-200 text-green-900 hover:bg-green-50 ring-1 ring-green-500"
                    : "bg-red-50 border-red-200 text-red-900 hover:bg-red-50 ring-1 ring-red-500"
                  : selected !== null && idx === correctIndex
                    ? "bg-green-50 border-green-200 text-green-900 ring-1 ring-green-500" // Show correct answer if wrong one selected
                    : "hover:bg-indigo-50 bg-white border-slate-200 hover:border-indigo-200"
              }`}
              onClick={() => handleSelect(idx)}
              disabled={selected !== null}
            >
              <div className="flex items-center gap-4 w-full">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 text-sm font-medium ${
                   selected === idx
                    ? isCorrect ? "border-green-500 text-green-700 bg-green-100" : "border-red-500 text-red-700 bg-red-100"
                    : selected !== null && idx === correctIndex
                      ? "border-green-500 text-green-700 bg-green-100"
                      : "border-slate-300 text-slate-500 bg-slate-50"
                }`}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="flex-1 text-base">{option}</span>
                {selected === idx && (
                  isCorrect 
                    ? <CheckCircle2 className="w-6 h-6 text-green-600" />
                    : <XCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
            </Button>
          ))}
        </div>
        
        {selected !== null && (
          <div className="mt-6 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className={`text-sm font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
              {isCorrect 
                ? "Correct! You've mastered this concept." 
                : "Not quite. The correct answer is highlighted."}
            </div>
            {!isCorrect && (
              <Button size="sm" variant="ghost" onClick={handleRetry}>
                Try Again
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}