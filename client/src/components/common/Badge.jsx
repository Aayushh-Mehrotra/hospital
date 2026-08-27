import React from 'react';
import { getStatusBadgeClass } from '../../utils/formatters';

export const Badge = ({ children, status, variant, className = '' }) => {
  const badgeStyle = status ? getStatusBadgeClass(status) : variant || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle} ${className}`}
    >
      {children || status}
    </span>
  );
};
