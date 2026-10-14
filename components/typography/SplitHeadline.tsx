import { Fragment, type Ref } from 'react';

type HeadingTag = 'h1' | 'h2' | 'h3';

export interface SplitHeadlineProps {
  lines: readonly string[];
  as?: HeadingTag;
  id?: string;
  className?: string;
  ref?: Ref<HTMLHeadingElement>;
}

/**
 * A display headline set as a block of authored lines. Lines are separated by
 * `<br>` so SplitText can measure them as lines, and by a space so the
 * accessible name reads as one sentence.
 */
export function SplitHeadline({ lines, as: Tag = 'h2', id, className, ref }: SplitHeadlineProps) {
  const classes = className ? `split-headline ${className}` : 'split-headline';
  return (
    <Tag ref={ref} id={id} className={classes} data-split-headline="">
      {lines.map((line, index) => (
        <Fragment key={line}>
          {line}
          {index < lines.length - 1 ? (
            <>
              {' '}
              <br />
            </>
          ) : null}
        </Fragment>
      ))}
    </Tag>
  );
}
