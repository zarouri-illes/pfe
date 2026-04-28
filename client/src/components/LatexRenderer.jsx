import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const LatexRenderer = ({ content, className = '' }) => {
  // dir="auto" provides native RTL support for languages like Arabic
  // when typing normal text alongside $math$ syntax.
  return (
    <div 
      dir="auto" 
      className={`w-full ${className}`}
      style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Prevent newlines from breaking tight inline layouts like buttons
          p: ({node, ...props}) => <span {...props} />
        }}
      >
        {String(content || '')}
      </ReactMarkdown>
    </div>
  );
};

export default LatexRenderer;
