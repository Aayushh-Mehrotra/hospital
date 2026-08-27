import React from 'react';

export const Tabs = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={`border-b border-slate-200 ${className}`}>
      <nav className="flex space-x-6 overflow-x-auto custom-scrollbar" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`whitespace-nowrap py-3.5 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                isActive
                  ? 'border-primary-600 text-primary-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {Icon && <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />}
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={`ml-2 py-0.5 px-2 rounded-full text-xs font-semibold ${
                    isActive ? 'bg-primary-100 text-primary-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
