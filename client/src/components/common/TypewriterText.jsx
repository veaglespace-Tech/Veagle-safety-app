import React from 'react';

export const TypewriterText = ({
  text,
  words = ['Instant 3-Second Protection'],
  className = '',
}) => {
  const displayText = text || (Array.isArray(words) ? words[0] : words);

  return <span className={`inline-block font-black text-rose ${className}`}>{displayText}</span>;
};

export default TypewriterText;
