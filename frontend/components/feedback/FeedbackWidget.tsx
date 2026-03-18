'use client';

import React, { useState, useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

interface FeedbackWidgetProps {
  trigger?: 'manual' | 'after_action' | 'on_exit';
  context?: string;
}

export function FeedbackWidget({ trigger = 'manual', context }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (trigger === 'on_exit') {
      const handleBeforeUnload = () => {
        // Show feedback prompt on exit intent
        if (!submitted && !isOpen) {
          setIsOpen(true);
        }
      };

      document.addEventListener('mouseout', (e) => {
        if (e.clientY < 0) handleBeforeUnload();
      });

      return () => document.removeEventListener('mouseout', handleBeforeUnload);
    }
  }, [trigger, submitted, isOpen]);

  const handleSubmit = async () => {
    if (!feedback && !rating) return;

    trackEvent('feedback_submitted', {
      rating,
      context,
      feedbackLength: feedback.length,
    });

    // Send to backend
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          rating,
          feedback,
          context,
          url: window.location.pathname,
        }),
      });
    } catch (error) {
      console.debug('Failed to send feedback:', error);
    }

    setSubmitted(true);
    setTimeout(() => {
      setIsOpen(false);
      setSubmitted(false);
      setFeedback('');
      setRating(null);
    }, 2000);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        Feedback
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 w-80 z-50 border">
      {submitted ? (
        <div className="text-center py-4">
          <div className="text-2xl mb-2">🙏</div>
          <p className="text-green-600 font-medium">Thank you for your feedback!</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900">How&apos;s your experience?</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          {/* Rating */}
          <div className="flex justify-center gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-2xl transition-colors ${
                  rating && star <= rating ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                ★
              </button>
            ))}
          </div>

          {/* Feedback text */}
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What was confusing or broken?"
            className="w-full border rounded-md p-2 text-sm mb-3 resize-none"
            rows={3}
          />

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!feedback && !rating}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Send Feedback
          </button>
        </>
      )}
    </div>
  );
}

// Inline feedback prompt after specific actions
export function ActionFeedback({ action, onSubmit }: { action: string; onSubmit: (feedback: string) => void }) {
  const [show, setShow] = useState(true);
  const [feedback, setFeedback] = useState('');

  if (!show) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
      <p className="text-sm text-blue-800 mb-2">
        You just {action}. Was anything confusing?
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Tell us what was unclear..."
          className="flex-1 border rounded px-3 py-1 text-sm"
        />
        <button
          onClick={() => {
            if (feedback) onSubmit(feedback);
            setShow(false);
          }}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
        >
          Send
        </button>
        <button
          onClick={() => setShow(false)}
          className="text-gray-500 px-2 py-1 text-sm hover:text-gray-700"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

export default FeedbackWidget;
