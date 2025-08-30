'use client';

import React from 'react';

interface PlanBadgeProps {
  plan: 'free' | 'plus';
}

export default function PlanBadge({ plan }: PlanBadgeProps) {
  if (plan === 'plus') {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <span className="mr-1">✨</span>
        NEXUS ACADEMY PLUS
      </div>
    );
  }

  return (
    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-700">
      FREE
    </div>
  );
}
