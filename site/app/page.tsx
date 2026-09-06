'use client';

import { useEffect, useState } from 'react';

type Stage = 'outside' | 'threshold' | 'inside';
type Focus = null | 'letter' | 'rooms' | 'frieze';

export default function Home() {
  const [stage, setStage] = useState<Stage>('outside');
  const [focus, setFocus] = useState<Focus>(null);
  const [viewpoint, setViewpoint] = useState(24);
  const [friezePosition, setFriezePosition] = useState(0);

  const moveScene = (event: React.PointerEvent<HTMLElement>) => {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    event.currentTarget.style.setProperty('--mx', x.toFixed(3));
    event.currentTarget.style.setProperty('--my', y.toFixed(3));
    event.currentTarget.style.setProperty('--px', `${event.clientX}px`);
    event.currentTarget.style.setProperty('--py', `${event.clientY}px`);
  };

  useEffect(() => {
    if (stage !== 'threshold') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setStage('inside'), reduced ? 40 : 1550);
    return () => window.clearTimeout(timer);
  }, [stage]);

  return (
    <main className={`experience stage-${stage}`} onPointerMove={moveScene}>
      <div className="cursor-mark" aria-hidden="true" />
      <div className="opening-slate" aria-hidden="true">
        <span>Vienna / 1902</span>
        <b>Before the doors open</b>
        <small>Salon Format</small>
      </div>
      <section className="exterior" aria-label="Vienna Secession, 15 April 1902" aria-hidden={stage === 'inside'}>
        <div className="exterior__art" aria-hidden="true">
          <img src="/images/secession-exterior-v8.png?v=controlled-ink" alt="" draggable="false" />
        </div>
        <div className="date-ghost" aria-hidden="true"><span>19</span><span>02</span></div>
        <div className="dome-glint" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
        <div className="exterior__copy">
          <p className="dateline"><span>Vienna</span><span>15 April 1902</span></p>
          <p className="hook-line">You arrive before the public does.</p>
          <h1>The exhibition<br />opens today.</h1>
          <button className="invitation" type="button" onClick={() => setStage('threshold')}>
            You should probably come inside.
          </button>
        </div>
        <aside className="experience-mark" aria-label="Experience context">
          <span>Before the doors open</span>
          <span>XIV Exhibition</span>
          <span>Vienna Secession</span>
        </aside>
        <button className="threshold" type="button" aria-label="Enter the Vienna Secession" onClick={() => setStage('threshold')} disabled={stage !== 'outside'}>
          <span className="threshold__ring" aria-hidden="true" />
          <span className="threshold__label">Enter</span>
        </button>
      </section>

      <div className="passage" aria-hidden="true"><span /><span /><span /><em>Inside / before opening</em></div>

      <section className="interior" aria-label="Inside the Vienna Secession" aria-hidden={stage !== 'inside'}>
        <div className="interior__architecture" aria-hidden="true">
          <img className="interior-art" src="/images/secession-interior-v4.png?v=controlled-ink" alt="" draggable="false" />
          <div className="pastel pastel--patina" />
          <div className="pastel pastel--blue" />
          <div className="pastel pastel--rose" />
          <div className="wall wall--left" />
          <div className="wall wall--right" />
          <div className="ceiling" />
          <div className="floor" />
          <div className="far-door" />
          <div className="gold-seam" />
          <div className="ink-line ink-line--one" />
          <div className="ink-line ink-line--two" />
        </div>
        <div className="grain grain--inside" aria-hidden="true" />
        <div className="interior__copy">
          <span className="room-number">15 April 1902 / Before opening</span>
          <h2>You’re here. Good.</h2>
          <p className="interior__line">There are still a few things to sort out.</p>
          <p className="helper-role">The public arrives later. For now, you’re helping with the final preparations.</p>
        </div>
        <nav className="attention" aria-label="Areas in the room">
          <p className="attention__prompt"><b>Your final check</b><span>Choose where to begin. Each area reveals a different decision behind opening day.</span></p>
          <button className="attention__item attention__item--letters" type="button" onClick={() => setFocus('letter')}>
            <i /><span><b>Correspondence</b><small>Inspect the letter from Dresden</small></span>
          </button>
          <button className="attention__item attention__item--rooms" type="button" onClick={() => setFocus('rooms')}>
            <i /><span><b>The rooms</b><small>Examine the opening and sightline</small></span>
          </button>
          <button className="attention__item attention__item--frieze" type="button" onClick={() => setFocus('frieze')}>
            <i /><span><b>The frieze</b><small>Enter Klimt’s left side hall</small></span>
          </button>
        </nav>
      </section>

      <section className={`chapter chapter--letter ${focus === 'letter' ? 'is-open' : ''}`} aria-hidden={focus !== 'letter'}>
        <img className="chapter__art" src="/images/correspondence-arnold-v1.png" alt="A hand-drawn reconstructed letter with two telegram slips" />
        <div className="chapter__veil" />
        <article className="document-copy">
          <span className="reconstruction">Reconstructed from archival correspondence</span>
          <p className="worker-cue"><b>What to do</b><span>Read what has not yet been settled.</span></p>
          <p className="chapter-kicker">10 April 1902 · Dresden → Vienna</p>
          <h3>Has the marble head arrived?</h3>
          <p>Klinger meant to send it with the Beethoven monument, but the dispatch was delayed.</p>
          <p>Two telegrams have already been sent.</p>
          <p>And one more question: what sale price is being asked for Klinger’s Beethoven sculpture?</p>
          <aside className="context-note">
            <b>Why it matters</b>
            <p>The exhibition was also a practical undertaking. Works had to travel, correspondence had to arrive, invitations had to be sent and prices had to be decided.</p>
            <p>This is not a fictional emergency. The uncertainty documented in Ernst Arnold’s letter is enough: five days before opening, transport and money were still part of the work.</p>
            <p>In the correspondence, “Beethoven” is shorthand for Max Klinger’s monumental sculpture of the composer — a polychrome work in bronze and marble, and the physical centre of the exhibition.</p>
            <strong>What you learn</strong><span>An exhibition is made through logistics, money and human decisions as well as art.</span>
          </aside>
          <button className="chapter-link" type="button" onClick={() => setFocus('rooms')}>Look at the rooms</button>
        </article>
        <button className="chapter-close" type="button" onClick={() => setFocus(null)} aria-label="Return to the preparation room">×</button>
      </section>

      <section className={`chapter chapter--rooms ${focus === 'rooms' ? 'is-open' : ''}`} aria-hidden={focus !== 'rooms'} style={{'--viewpoint': viewpoint, '--model-scale': 1.24 - viewpoint * .0022, '--model-shift': `${(viewpoint - 50) * -.22}%`} as React.CSSProperties}>
        <img className="chapter__art room-model-art" src="/images/spatial-model-v1.png" alt="An abstract hand-drawn model showing the left side hall opening toward Klinger’s Beethoven" />
        <article className="rooms-copy">
          <p className="chapter-kicker">The rooms</p>
          <p className="worker-cue"><b>What to do</b><span>Move the control from left to right. Follow the view from Klimt’s frieze, through the wall opening, to Klinger’s statue.</span></p>
          <h3>Make the room make sense.</h3>
          <p>Painting. Sculpture. Architecture.</p>
          <p>Designed to be experienced together.</p>
          <aside className="context-note">
            <b>Why it matters</b>
            <p>Under Josef Hoffmann’s direction, twenty-one artists shaped one exhibition. Klinger’s statue stood in the main hall, Klimt’s frieze in the left side hall, and a wall opening connected both views.</p>
            <strong>What you learn</strong><span>Gesamtkunstwerk here is spatial: painting, sculpture and architecture shape one experience.</span>
          </aside>
        </article>
        <div className="room-control">
          <div className="view-step" aria-live="polite"><b>{viewpoint < 34 ? '01 / The frieze' : viewpoint < 72 ? '02 / The opening' : '03 / Beethoven'}</b><span>{viewpoint < 34 ? 'Begin in Klimt’s left side hall.' : viewpoint < 72 ? 'Continue toward the opening in the wall.' : 'The view pulls back: painting, architecture and sculpture become one composition.'}</span></div>
          <label htmlFor="viewpoint">Follow the view across the model <span>{viewpoint > 72 ? 'The relationship is visible. You have completed the spatial check.' : 'Move slowly from left to right.'}</span></label>
          <input id="viewpoint" type="range" min="0" max="100" value={viewpoint} onChange={(event) => setViewpoint(Number(event.target.value))} />
          <button className="chapter-link" type="button" onClick={() => setFocus('frieze')} disabled={viewpoint <= 72}>{viewpoint > 72 ? 'Enter Klimt’s room' : 'Complete the view first'}</button>
        </div>
        <button className="chapter-close" type="button" onClick={() => setFocus(null)} aria-label="Return to the preparation room">×</button>
      </section>

      <section className={`chapter chapter--frieze ${focus === 'frieze' ? 'is-open' : ''}`} aria-hidden={focus !== 'frieze'} style={{'--frieze': friezePosition} as React.CSSProperties}>
        <div className="frieze-pan"><img className="chapter__art" src="/images/beethoven-frieze-v1.png" alt="An original hand-drawn abstract interpretation of the Beethoven Frieze" /></div>
        <div className="frieze-copy">
          <p className="worker-cue worker-cue--frieze"><b>What to do</b><span>Walk the left side hall once before the public does. Follow the procession to its end.</span></p>
          <p>{['A search for happiness.', 'Resistance.', 'Desire.', 'The arts.', 'And finally — a kiss.'][friezePosition]}</p>
          <aside className="context-note context-note--frieze">
            <b>Why this room matters</b>
            <p>The exhibition honoured Ludwig van Beethoven on the seventy-fifth anniversary of his death. Around 1900 he was revered as the gifted artist who suffers yet creates something universal.</p>
            <p>Klimt turned the human search for happiness — inspired by Beethoven’s Ninth Symphony — into a procession across three walls. The final kiss answers the struggle that comes before it.</p>
            <p>The frieze was conceived for this exhibition, not as an isolated permanent mural. Its rhythm, scale and procession belonged to Hoffmann’s temporary architecture and to the encounter with Klinger’s sculpture.</p>
            <strong>What you learn</strong><span>The frieze changes meaning when it is experienced as a route through a specific room.</span>
          </aside>
          <div className="frieze-controls" aria-label="Move through the frieze">
            <span>0{friezePosition + 1} / 05</span>
            {friezePosition > 0 && <button type="button" onClick={() => setFriezePosition(friezePosition - 1)}>Back along the wall</button>}
            {friezePosition < 4 && <button type="button" onClick={() => setFriezePosition(friezePosition + 1)}>Continue along the wall</button>}
          </div>
          {friezePosition === 4 && <div className="frieze-reveal"><span>This room was made for this exhibition.</span><small>The frieze was conceived as part of something temporary. Now look back through the opening: Klimt’s room and Klinger’s Beethoven were designed to be experienced together.</small></div>}
        </div>
        <button className="chapter-close chapter-close--light" type="button" onClick={() => setFocus(null)} aria-label="Return to the preparation room">×</button>
      </section>
    </main>
  );
}
