'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// Add custom styles to fix any conflicts
const customStyles = `
  .katex-display {
    margin: 0.5em 0;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .katex {
    font-size: 0.9em;
  }

  /* Fix for any inline math */
  .katex-inline {
    display: inline-block;
  }
`;

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isTyping?: boolean;
}

export function MarkdownRenderer({ content, className, isTyping }: MarkdownRendererProps) {
  // Pre-process content to fix common issues
  const processedContent = content
    // Fix broken math notation
    .replace(/\\\[/g, '[')
    .replace(/\\\]/g, ']')
    // Fix times symbol
    .replace(/\\times/g, '×')
    // Fix en-dashes to normal dashes
    .replace(/‑/g, '-')
    // Fix double backslashes
    .replace(/\\\\/g, '\\');

  return (
    <>
      <style jsx global>{customStyles}</style>
      <div className={`${className || ''}`}>
        <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Keep the same text styles as before
          p: ({ children }) => (
            <p className="mb-2 leading-relaxed text-sm whitespace-pre-wrap">
              {children}
              {isTyping && (
                <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
              )}
            </p>
          ),
          // Inline code
          code: ({ inline, className: codeClassName, children }) => {
            if (inline) {
              return (
                <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
                  {children}
                </code>
              );
            }
            return (
              <code className={codeClassName}>
                {children}
              </code>
            );
          },
          // Code blocks
          pre: ({ children }) => (
            <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs">
              {children}
            </pre>
          ),
          // Bold text
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          // Italic text
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 text-sm">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 text-sm">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="mb-1">{children}</li>
          ),
          // Headings - keep them small to match the current style
          h1: ({ children }) => (
            <h1 className="text-lg font-bold mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold mb-2">{children}</h3>
          ),
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-muted-foreground/30 pl-3 italic text-sm">
              {children}
            </blockquote>
          ),
          // Math blocks - handled by KaTeX
          div: ({ className: divClassName, children, ...props }) => {
            // Check if this is a KaTeX math block
            if (divClassName?.includes('katex')) {
              return <div className={divClassName} {...props}>{children}</div>;
            }
            return <div className={divClassName} {...props}>{children}</div>;
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
    </>
  );
}