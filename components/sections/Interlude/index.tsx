import { copy } from '../../../data/copy';

export default function Interlude() {
  return (
    <section id="interlude" aria-labelledby="interlude-heading">
      <h2 id="interlude-heading">{copy.stories.heading}</h2>
      <p>
        {copy.stories.interlude.map((word) => (
          <span key={word}>{word} </span>
        ))}
      </p>
    </section>
  );
}
