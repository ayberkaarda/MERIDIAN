import { Fragment, type CSSProperties } from 'react';

type HeadingTag = 'h1' | 'h2' | 'h3';
export type EditorialLineState = 'pending' | 'active' | 'past';

export interface EditorialStatementProps {
  lines: readonly string[];
  as?: HeadingTag;
  id?: string;
  className?: string;
}

/**
 * Serif statement set one authored line per row. Each row is a clipping mask
 * around its text so a line can rise into place on its own beat.
 * The server render is the resolved composition: earlier lines rest on
 * --muted and the last line holds full ink.
 */
export function EditorialStatement({ lines, as: Tag = 'h2', id, className }: EditorialStatementProps) {
  const classes = className ? `editorial-statement ${className}` : 'editorial-statement';
  const last = lines.length - 1;
  return (
    <Tag id={id} className={classes}>
      {lines.map((line, index) => {
        const state: EditorialLineState = index === last ? 'active' : 'past';
        return (
          <Fragment key={line}>
            {index > 0 ? ' ' : null}
            <span
              className="editorial-statement__line"
              data-editorial-line={index}
              data-state={state}
              style={{ '--line-index': index } as CSSProperties}
            >
              <span className="editorial-statement__text">{line}</span>
            </span>
          </Fragment>
        );
      })}
    </Tag>
  );
}
