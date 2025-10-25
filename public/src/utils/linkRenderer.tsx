import React from 'react';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export const renderTextWithLinks = (text: string, className?: string) => {
  const parts = text.split(URL_REGEX);
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (URL_REGEX.test(part)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </span>
  );
};