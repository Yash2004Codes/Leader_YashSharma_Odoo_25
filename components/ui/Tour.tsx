'use client';

import { useEffect, useState, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface TourStep {
  id: string;
  target: string; // CSS selector or data attribute
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  placement?: 'start' | 'center' | 'end';
}

interface TourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  storageKey?: string;
}

export function Tour({ steps, isOpen, onClose, onComplete, storageKey = 'stockmaster-tour-completed' }: TourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightPosition, setHighlightPosition] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && steps.length > 0) {
      updateHighlight();
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, currentStep, steps]);

  useEffect(() => {
    if (isOpen) {
      const handleResize = () => updateHighlight();
      const handleScroll = () => updateHighlight();
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen, currentStep]);

  const updateHighlight = () => {
    if (currentStep >= steps.length) return;

    const step = steps[currentStep];
    let element: HTMLElement | null = null;

    // If target starts with '[', treat it as a data attribute value
    // Otherwise, treat it as a CSS selector
    if (step.target.startsWith('[') && step.target.endsWith(']')) {
      // Extract the value from [data-tour="value"] format
      const match = step.target.match(/\[data-tour="(.+)"\]/);
      if (match && match[1]) {
        element = document.querySelector(`[data-tour="${match[1]}"]`) as HTMLElement;
      }
    } else {
      // Try as data-tour attribute value directly
      element = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement;
      
      // If not found, try as CSS selector
      if (!element) {
        element = document.querySelector(step.target) as HTMLElement;
      }
    }

    if (element) {
      const rect = element.getBoundingClientRect();
      setHighlightPosition(rect);
      
      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    } else {
      setHighlightPosition(null);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Store in sessionStorage instead of localStorage so it shows on each new session
    if (storageKey) {
      sessionStorage.setItem(storageKey, 'true');
    }
    onComplete();
    onClose();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isOpen || steps.length === 0) return null;

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  // Calculate tooltip position with viewport bounds checking
  let tooltipStyle: React.CSSProperties = {};
  if (highlightPosition && typeof window !== 'undefined') {
    const position = step.position || 'bottom';
    const placement = step.placement || 'center';
    const tooltipWidth = Math.min(320, window.innerWidth - 32); // w-80 = 320px, but max viewport - padding
    const tooltipHeight = 280; // Approximate height (increased for better fit)
    const padding = 16; // Reduced padding for better fit
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let top = 0;
    let left = 0;
    let transform = '';
    
    switch (position) {
      case 'top':
        top = highlightPosition.top - padding;
        left = placement === 'start' 
          ? highlightPosition.left
          : placement === 'end'
          ? highlightPosition.right - tooltipWidth
          : highlightPosition.left + highlightPosition.width / 2;
        transform = placement === 'center' ? 'translate(-50%, -100%)' : 'translateY(-100%)';
        
        // Check if tooltip goes above viewport
        if (top - tooltipHeight < padding) {
          top = highlightPosition.bottom + padding;
          transform = placement === 'center' ? 'translateX(-50%)' : 'none';
          // Re-check if it still goes above after moving
          if (top - tooltipHeight < padding) {
            top = padding;
          }
        }
        
        // Check if tooltip goes off left edge
        if (left < padding) {
          left = padding;
          if (placement === 'center') {
            transform = 'none';
          }
        }
        
        // Check if tooltip goes off right edge
        if (left + tooltipWidth > viewportWidth - padding) {
          left = Math.max(padding, viewportWidth - tooltipWidth - padding);
          if (placement === 'center') {
            transform = 'none';
          }
        }
        
        // Ensure tooltip doesn't go below viewport
        if (top + tooltipHeight > viewportHeight - padding) {
          top = Math.max(padding, viewportHeight - tooltipHeight - padding);
        }
        
        tooltipStyle = { top: `${top}px`, left: `${left}px`, transform };
        break;
        
      case 'bottom':
        top = highlightPosition.bottom + padding;
        left = placement === 'start'
          ? highlightPosition.left
          : placement === 'end'
          ? highlightPosition.right - tooltipWidth
          : highlightPosition.left + highlightPosition.width / 2;
        transform = placement === 'center' ? 'translateX(-50%)' : 'none';
        
        // Check if tooltip goes below viewport
        if (top + tooltipHeight > viewportHeight - padding) {
          top = highlightPosition.top - padding;
          transform = placement === 'center' ? 'translate(-50%, -100%)' : 'translateY(-100%)';
          // Re-check if it still goes below after moving
          if (top + tooltipHeight > viewportHeight - padding) {
            top = Math.max(padding, viewportHeight - tooltipHeight - padding);
            transform = 'none';
          }
        }
        
        // Check if tooltip goes off left edge
        if (left < padding) {
          left = padding;
          if (placement === 'center') {
            transform = 'none';
          }
        }
        
        // Check if tooltip goes off right edge
        if (left + tooltipWidth > viewportWidth - padding) {
          left = Math.max(padding, viewportWidth - tooltipWidth - padding);
          if (placement === 'center') {
            transform = 'none';
          }
        }
        
        // Ensure tooltip doesn't go above viewport
        if (top < padding) {
          top = padding;
        }
        
        tooltipStyle = { top: `${top}px`, left: `${left}px`, transform };
        break;
        
      case 'left':
        top = highlightPosition.top + highlightPosition.height / 2;
        left = highlightPosition.left - padding;
        transform = 'translate(-100%, -50%)';
        
        // Check if tooltip goes off left edge
        if (left - tooltipWidth < padding) {
          left = highlightPosition.right + padding;
          transform = 'translateY(-50%)';
          // If still off-screen, try right side
          if (left + tooltipWidth > viewportWidth - padding) {
            left = Math.max(padding, viewportWidth - tooltipWidth - padding);
            transform = 'translateY(-50%)';
          }
        }
        
        // Check if tooltip goes above viewport
        if (top - tooltipHeight / 2 < padding) {
          top = padding + tooltipHeight / 2;
        }
        
        // Check if tooltip goes below viewport
        if (top + tooltipHeight / 2 > viewportHeight - padding) {
          top = Math.max(padding + tooltipHeight / 2, viewportHeight - padding - tooltipHeight / 2);
        }
        
        tooltipStyle = { top: `${top}px`, left: `${left}px`, transform };
        break;
        
      case 'right':
        top = highlightPosition.top + highlightPosition.height / 2;
        left = highlightPosition.right + padding;
        transform = 'translateY(-50%)';
        
        // Check if tooltip goes off right edge
        if (left + tooltipWidth > viewportWidth - padding) {
          left = highlightPosition.left - padding;
          transform = 'translate(-100%, -50%)';
          // If still off-screen, try left side
          if (left - tooltipWidth < padding) {
            left = padding;
            transform = 'translateY(-50%)';
          }
        }
        
        // Check if tooltip goes above viewport
        if (top - tooltipHeight / 2 < padding) {
          top = padding + tooltipHeight / 2;
        }
        
        // Check if tooltip goes below viewport
        if (top + tooltipHeight / 2 > viewportHeight - padding) {
          top = Math.max(padding + tooltipHeight / 2, viewportHeight - padding - tooltipHeight / 2);
        }
        
        tooltipStyle = { top: `${top}px`, left: `${left}px`, transform };
        break;
        
      case 'center':
        tooltipStyle = {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
        break;
    }
  }

  return (
    <>
      {/* Overlay with cutout */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9998] bg-black/60 transition-opacity"
        onClick={handleSkip}
      >
        {highlightPosition && (
          <div
            className="absolute border-4 border-primary-500 rounded-lg shadow-2xl pointer-events-none"
            style={{
              top: `${highlightPosition.top - 4}px`,
              left: `${highlightPosition.left - 4}px`,
              width: `${highlightPosition.width + 8}px`,
              height: `${highlightPosition.height + 8}px`,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      {highlightPosition && (
        <div
          ref={tooltipRef}
          className="fixed z-[9999] w-80 max-w-[calc(100vw-2rem)] animate-in fade-in-0 slide-in-from-bottom-2"
          style={tooltipStyle}
        >
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-6 max-h-[calc(100vh-2rem)] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{step.title}</h3>
                  <p className="text-xs text-gray-500">
                    Step {currentStep + 1} of {steps.length}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close tour"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <p className="text-gray-700 mb-6 leading-relaxed">{step.content}</p>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Skip Tour
              </button>
              <div className="flex gap-2">
                {!isFirst && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleNext}
                >
                  {isLast ? 'Get Started' : 'Next'}
                  {!isLast && <ChevronRight className="h-4 w-4 ml-1" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Hook to check if tour should be shown
export function useTour(storageKey: string = 'stockmaster-tour-completed') {
  const [shouldShowTour, setShouldShowTour] = useState(false);

  useEffect(() => {
    // Use sessionStorage instead of localStorage so tour shows on each new login session
    // Check if tour was completed in current session
    const hasSeenTourInSession = sessionStorage.getItem(storageKey) === 'true';
    setShouldShowTour(!hasSeenTourInSession);
  }, [storageKey]);

  const markTourComplete = () => {
    // Store in sessionStorage so it only prevents showing again in current session
    sessionStorage.setItem(storageKey, 'true');
    setShouldShowTour(false);
  };

  return { shouldShowTour, markTourComplete };
}

