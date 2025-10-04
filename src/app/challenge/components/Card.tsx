import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`bg-white dark:bg-slate-800/50 rounded-lg shadow-lg ring-1 ring-slate-200 dark:ring-slate-700 p-6 ${className}`}>
            {children}
        </div>
    );
};

export default Card;
