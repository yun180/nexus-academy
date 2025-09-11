'use client';

import React from 'react';

interface UsageCardProps {
  title: string;
  current: number;
  max: number;
  color: 'blue' | 'green' | 'purple' | 'orange';
  unlimited?: boolean;
}

export default function UsageCard({ title, current, max, color, unlimited }: UsageCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800', 
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
  };

  const progressColors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500', 
    orange: 'bg-orange-500',
  };

  const percentage = unlimited ? 100 : Math.min((current / max) * 100, 100);

  return (
    <div className={`rounded-lg p-6 ${colorClasses[color]}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">{title}</h3>
        <span className="text-2xl font-bold">
          {unlimited ? '∞' : `${current}/${max}`}
        </span>
      </div>
      <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${progressColors[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
