import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  variant?: 'default' | 'medical' | 'compact';
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className,
  variant = 'default'
}) => {
  const baseStyles = {
    default: 'prose prose-sm max-w-none',
    medical: 'prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:font-semibold',
    compact: 'prose prose-xs max-w-none prose-p:my-1 prose-headings:my-2'
  };

  const customComponents = {
    // Custom heading styles
    h1: ({ children, ...props }: any) => (
      <h1 
        className={cn(
          "text-xl font-bold mb-3 mt-4 text-gray-900 border-b border-gray-200 pb-2",
          variant === 'medical' && "text-blue-900 border-blue-200"
        )} 
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 
        className={cn(
          "text-lg font-semibold mb-2 mt-3 text-gray-800",
          variant === 'medical' && "text-blue-800"
        )} 
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 
        className={cn(
          "text-base font-medium mb-2 mt-2 text-gray-700",
          variant === 'medical' && "text-blue-700"
        )} 
        {...props}
      >
        {children}
      </h3>
    ),
    
    // Custom paragraph styles
    p: ({ children, ...props }: any) => (
      <p 
        className={cn(
          "mb-3 text-gray-700 leading-relaxed",
          variant === 'compact' && "mb-2 text-sm"
        )} 
        {...props}
      >
        {children}
      </p>
    ),
    
    // Custom list styles
    ul: ({ children, ...props }: any) => (
      <ul 
        className={cn(
          "list-disc list-inside mb-3 space-y-1 text-gray-700",
          variant === 'compact' && "mb-2 space-y-0.5 text-sm"
        )} 
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol 
        className={cn(
          "list-decimal list-inside mb-3 space-y-1 text-gray-700",
          variant === 'compact' && "mb-2 space-y-0.5 text-sm"
        )} 
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => (
      <li 
        className={cn(
          "text-gray-700 leading-relaxed",
          variant === 'compact' && "text-sm"
        )} 
        {...props}
      >
        {children}
      </li>
    ),
    
    // Custom emphasis styles
    strong: ({ children, ...props }: any) => (
      <strong 
        className={cn(
          "font-semibold text-gray-900",
          variant === 'medical' && "text-blue-900"
        )} 
        {...props}
      >
        {children}
      </strong>
    ),
    em: ({ children, ...props }: any) => (
      <em 
        className="italic text-gray-800" 
        {...props}
      >
        {children}
      </em>
    ),
    
    // Custom code styles
    code: ({ children, inline, ...props }: any) => (
      inline ? (
        <code 
          className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono" 
          {...props}
        >
          {children}
        </code>
      ) : (
        <code 
          className="block bg-gray-100 text-gray-800 p-3 rounded text-sm font-mono whitespace-pre-wrap" 
          {...props}
        >
          {children}
        </code>
      )
    ),
    
    // Custom blockquote styles
    blockquote: ({ children, ...props }: any) => (
      <blockquote 
        className={cn(
          "border-l-4 border-blue-200 pl-4 py-2 my-3 bg-blue-50 text-gray-700 italic",
          variant === 'medical' && "border-blue-300 bg-blue-50"
        )} 
        {...props}
      >
        {children}
      </blockquote>
    ),
    
    // Custom table styles for medical data
    table: ({ children, ...props }: any) => (
      <div className="overflow-x-auto my-4">
        <table 
          className="min-w-full border border-gray-200 rounded-lg" 
          {...props}
        >
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }: any) => (
      <thead 
        className="bg-gray-50" 
        {...props}
      >
        {children}
      </thead>
    ),
    th: ({ children, ...props }: any) => (
      <th 
        className="px-4 py-2 text-left text-sm font-semibold text-gray-900 border-b border-gray-200" 
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }: any) => (
      <td 
        className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100" 
        {...props}
      >
        {children}
      </td>
    ),
    
    // Custom horizontal rule
    hr: ({ ...props }: any) => (
      <hr 
        className="my-4 border-gray-200" 
        {...props}
      />
    )
  };

  return (
    <div className={cn(baseStyles[variant], className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={customComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
