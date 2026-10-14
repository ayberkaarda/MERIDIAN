import { Fragment } from 'react';

export interface MonoMetaProps {
  items: readonly string[];
  className?: string;
}

/** A mono metadata line: items joined by a hairline slash that assistive tech skips. */
export function MonoMeta({ items, className }: MonoMetaProps) {
  const classes = className ? `mono-meta type-meta ${className}` : 'mono-meta type-meta';
  return (
    <p className={classes}>
      {items.map((item, index) => (
        <Fragment key={item}>
          {index > 0 ? (
            <>
              {' '}
              <span aria-hidden="true" className="mono-meta__separator">
                /
              </span>{' '}
            </>
          ) : null}
          <span className="mono-meta__item">{item}</span>
        </Fragment>
      ))}
    </p>
  );
}
