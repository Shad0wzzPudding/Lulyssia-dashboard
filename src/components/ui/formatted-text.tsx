import React, { Fragment } from 'react';
import { cloneElement, isValidElement } from 'react';

interface FormattedTextProps {
  children: string;
  className?: string;
}

// The editor stores literal `*` and `~` escaped as `\*` / `\~`. Swap them for
// placeholders while parsing so they are never read as formatting, then show
// them as plain `*` / `~`.
const ESC_STAR = '\u0001';
const ESC_TILDE = '\u0002';
const protectEscapes = (text: string) => text.replace(/\\\*/g, ESC_STAR).replace(/\\~/g, ESC_TILDE);
const restoreEscapes = (text: string) => text.split(ESC_STAR).join('*').split(ESC_TILDE).join('~');

/**
 * Renders text with ***bold italic***, **bold**, *italic*, and ~~strikethrough~~ support.
 */
export const FormattedText = ({ children, className }: FormattedTextProps) => {
  if (!children) return null;

  // Split by formatting patterns: **bold**, *italic*, ~~strike~~
  // Process in order: bold first, then italic, then strikethrough
  const renderFormatted = (text: string): React.ReactNode[] => {
    // Split by ~~...~~ 
    const parts = text.split(/(~~[\s\S]+?~~)/g);
    
    return parts.flatMap((part, i) => {
      if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) {
        return [
          <span key={`s-${i}`} className="line-through opacity-60">
            {renderBoldItalic(part.slice(2, -2))}
          </span>
        ];
      }
      return renderBoldItalic(part).map((node, j) => {
        if (isValidElement(node)) return cloneElement(node, { key: `t-${i}-${j}` });
        return <span key={`t-${i}-${j}`}>{node}</span>;
      });
    });
  };

  const renderBoldItalic = (text: string): React.ReactNode[] => {
    // Bold+italic ***text*** first (so its stars aren't split up), then bold **text**
    const parts = text.split(/(\*\*\*[^*]+?\*\*\*|\*\*[^*]+?\*\*)/g);
    return parts.flatMap((part, i) => {
      if (part.startsWith('***') && part.endsWith('***') && part.length > 6) {
        return [
          <strong key={`b-${i}`} className="font-bold">
            <em className="italic">{restoreEscapes(part.slice(3, -3))}</em>
          </strong>,
        ];
      }
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return [<strong key={`b-${i}`} className="font-bold">{renderItalic(part.slice(2, -2))}</strong>];
      }
      return renderItalic(part).map((node, j) => {
        if (isValidElement(node)) return cloneElement(node, { key: `bi-${i}-${j}` });
        return <span key={`bi-${i}-${j}`}>{node}</span>;
      });
    });
  };

  const renderItalic = (text: string): React.ReactNode[] => {
    // Italic *text* (not **)
    const parts = text.split(/(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)/g);
    const result: React.ReactNode[] = [];
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 1) {
        result.push(<em key={`i-${i}`} className="italic">{restoreEscapes(parts[i])}</em>);
      } else if (parts[i]) {
        result.push(restoreEscapes(parts[i]));
      }
    }
    return result;
  };

  return (
    <span className={className}>
      {renderFormatted(protectEscapes(children))}
    </span>
  );
};
