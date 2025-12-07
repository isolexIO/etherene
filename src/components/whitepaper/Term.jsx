import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Term({ term, definition }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="underline decoration-dotted cursor-help text-indigo-600 font-medium hover:text-indigo-800 transition-colors">
            {term}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-slate-900 text-white border-slate-800">
          <p className="text-sm">{definition}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}