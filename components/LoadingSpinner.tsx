
import React from 'react';

interface LoadingSpinnerProps {
  size?: string;
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = '8', color = 'blue-500' }) => {
  return (
    <div className="flex justify-center items-center">
      <div
        className={`animate-spin rounded-full h-${size} w-${size} border-b-2 border-t-2 border-${color}`}
      ></div>
    </div>
  );
};

export default LoadingSpinner;
