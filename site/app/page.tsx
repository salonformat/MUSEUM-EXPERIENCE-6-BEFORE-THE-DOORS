'use client';

import { useEffect, useState } from 'react';

type Stage = 'outside' | 'threshold' | 'inside';

export default function Home() {
  const [stage, setStage] = useState<Stage>('outside');

  useEffect(() => {
    if (stage !== 'threshold') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setStage('inside'), reduced ? 40 : 1550);
    return () => window.clearTimeout(timer);
  }, [stage]);

  return (
    <main className={`experience stage-${stage}`}>
      <section className="exterior" aria-label="Vienna Secession, 15 April 1902" aria-hidden={stage === 'inside'}>
        <div className="exterior__art" aria-hidden="true">
          <img src="/images/secession-exterior-working.png" alt="" draggable="false" />
        </div>
        <div className="grain" aria-hidden="true" />
        <div className="exterior__copy">
          <p className="dateline"><span>Vienna</span><span>15 April 1902</span></p>
          <h1>The exhibition<br />opens today.</h1>
          <p className="invitation">You should probably come inside.</p>
        </div>
        <button className="threshold" type="button" aria-label="Enter the Vienna Secession" onClick={() => setStage('threshold')} disabled={stage !== 'outside'}>
          <span className="threshold__ring" aria-hidden="true" />
          <span className="threshold__label">Enter</span>
        </button>
      </section>

      <div className="passage" aria-hidden="true"><span /><span /><span /></div>

      <section className="interior" aria-label="Inside the Vienna Secession" aria-hidden={stage !== 'inside'}>
        <div className="interior__architecture" aria-hidden="true">
          <div className="wall wall--left" />
          <div className="wall wall--right" />
          <div className="ceiling" />
          <div className="floor" />
          <div className="far-door" />
          <div className="gold-seam" />
        </div>
        <div className="grain grain--inside" aria-hidden="true" />
        <div className="interior__copy">
          <p className="interior__kicker">Before the doors open</p>
          <h2>You’re here. Good.</h2>
          <p>There are still a few things to sort out.</p>
        </div>
        <nav className="attention" aria-label="Areas in the room">
          <button type="button"><i />Correspondence</button>
          <button type="button"><i />The rooms</button>
          <button type="button"><i />The frieze</button>
        </nav>
      </section>
    </main>
  );
}
