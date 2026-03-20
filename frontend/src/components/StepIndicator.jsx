import React from 'react';

export default function StepIndicator({ currentStep, steps, onStepClick }) {
  return (
    <nav className="flex items-center space-x-2 mb-6">
      {steps.map((step, idx) => {
        const num = idx + 1;
        const isActive = num === currentStep;
        const isComplete = num < currentStep;
        return (
          <React.Fragment key={num}>
            <button
              onClick={() => onStepClick(num)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isActive ? 'bg-indigo-600 text-white shadow-sm' :
                isComplete ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 cursor-pointer' :
                'bg-gray-100 text-gray-400 cursor-pointer hover:bg-gray-200'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                isActive ? 'bg-white text-indigo-600' :
                isComplete ? 'bg-indigo-600 text-white' :
                'bg-gray-300 text-gray-500'
              }`}>
                {isComplete ? '\u2713' : num}
              </span>
              {step}
            </button>
            {idx < steps.length - 1 && (
              <span className="text-gray-300 text-xs">&rsaquo;</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
