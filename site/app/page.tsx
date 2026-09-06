'use client';

import { useEffect, useState } from 'react';

type Stage = 'outside' | 'threshold' | 'inside';

export default function Home() {
  const [stage, setStage] = useState<Stage>('outside');

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
        <div className="date-ghost" aria-hidden="true">1902</div>
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
          <button className="attention__item attention__item--letters" type="button">
            <i /><span><b>Correspondence</b><small>Inspect the letter from Dresden</small></span>
          </button>
          <button className="attention__item attention__item--rooms" type="button">
            <i /><span><b>The rooms</b><small>Examine the opening and sightline</small></span>
          </button>
          <button className="attention__item attention__item--frieze" type="button">
            <i /><span><b>The frieze</b><small>Enter Klimt’s left side hall</small></span>
          </button>
        </nav>
      </section>
    </main>
  );
}
