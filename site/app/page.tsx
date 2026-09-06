'use client';

import { useEffect, useRef, useState } from 'react';

type Stage = 'outside' | 'threshold' | 'inside';
type Focus = null | 'letter' | 'rooms' | 'frieze' | 'invitation' | 'doors' | 'epilogue';

export default function Home() {
  const [stage, setStage] = useState<Stage>('outside');
  const [focus, setFocus] = useState<Focus>(null);
  const [friezePosition, setFriezePosition] = useState(0);
  const [roomEntering, setRoomEntering] = useState(false);
  const [interiorRevealed, setInteriorRevealed] = useState(false);
  const [modelRevealed, setModelRevealed] = useState(false);
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const friezeDrag = useRef<{ x: number; position: number } | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const audioMaster = useRef<GainNode | null>(null);
  const climaxPlayed = useRef(false);
  const friezeIndex = Math.min(4, Math.max(0, Math.round(friezePosition)));

  const ensureSound = () => {
    if (audioContext.current) return audioContext.current;
    const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = new AudioCtor();
    const master = context.createGain();
    master.gain.value = soundEnabled ? .16 : 0;
    master.connect(context.destination);
    const roomTone = context.createOscillator();
    const roomGain = context.createGain();
    roomTone.type = 'sine';
    roomTone.frequency.value = 48;
    roomGain.gain.value = .035;
    roomTone.connect(roomGain).connect(master);
    roomTone.start();
    audioContext.current = context;
    audioMaster.current = master;
    return context;
  };

  const soundCue = (kind: 'threshold' | 'room' | 'paper' | 'passage' | 'frieze' | 'climax' | 'doors') => {
    const context = ensureSound();
    const master = audioMaster.current;
    if (!master) return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const settings = {
      threshold:[72,42,.85,'sine'], room:[110,165,1.1,'sine'], paper:[620,410,.18,'triangle'],
      passage:[86,260,1.35,'sine'], frieze:[190,235,.32,'triangle'], climax:[146,438,2.4,'sine'], doors:[55,82,1.8,'sine']
    }[kind] as [number,number,number,OscillatorType];
    oscillator.type = settings[3];
    oscillator.frequency.setValueAtTime(settings[0], now);
    oscillator.frequency.exponentialRampToValueAtTime(settings[1], now + settings[2]);
    filter.type = 'lowpass';
    filter.frequency.value = kind === 'paper' ? 1800 : 720;
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === 'climax' ? .24 : .11, now + .035);
    gain.gain.exponentialRampToValueAtTime(.0001, now + settings[2]);
    oscillator.connect(filter).connect(gain).connect(master);
    oscillator.start(now); oscillator.stop(now + settings[2] + .05);
  };

  const enterThreshold = () => { soundCue('threshold'); setStage('threshold'); };
  const beginRoom = () => { soundCue('room'); setStage('inside'); };

  const enterKlimtRoom = () => {
    if (roomEntering) return;
    soundCue('passage');
    setRoomEntering(true);
    window.setTimeout(() => {
      setFocus('frieze');
      setRoomEntering(false);
    }, 1250);
  };

  const openDoors = () => {
    if (doorsOpen) return;
    soundCue('doors');
    setDoorsOpen(true);
    window.setTimeout(() => setFocus('epilogue'), 1700);
  };

  const replay = () => {
    window.location.reload();
  };

  useEffect(() => {
    if (audioMaster.current && audioContext.current) {
      audioMaster.current.gain.setTargetAtTime(soundEnabled ? .16 : 0, audioContext.current.currentTime, .08);
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (focus !== 'frieze') return;
    if (friezeIndex === 4 && !climaxPlayed.current) { climaxPlayed.current = true; soundCue('climax'); }
  }, [focus, friezeIndex]);

  const moveScene = (event: React.PointerEvent<HTMLElement>) => {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    event.currentTarget.style.setProperty('--mx', x.toFixed(3));
    event.currentTarget.style.setProperty('--my', y.toFixed(3));
    event.currentTarget.style.setProperty('--px', `${event.clientX}px`);
    event.currentTarget.style.setProperty('--py', `${event.clientY}px`);
  };

  return (
    <main className={`experience stage-${stage} ${interiorRevealed ? 'interior-revealed' : ''}`} onPointerMove={moveScene}>
      <div className="cursor-mark" aria-hidden="true" />
      <button className="sound-toggle" type="button" onClick={() => setSoundEnabled((enabled) => !enabled)} aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}><i aria-hidden="true" />{soundEnabled ? 'Sound on' : 'Sound off'}</button>
      <div className="opening-slate" aria-hidden="true">
        <span>Vienna / 1902</span>
        <b>Before the doors open</b>
        <small>Salon Format</small>
      </div>
      <section className="exterior" aria-label="Vienna Secession, 15 April 1902" aria-hidden={stage === 'inside'}>
        <div className="exterior__art" aria-hidden="true">
          <img src="/images/secession-exterior-v8.png?v=controlled-ink" alt="" draggable="false" />
        </div>
        <div className="dome-glint" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
        <div className="exterior__copy">
          <p className="dateline"><span>Vienna</span><span>15 April</span><strong>1902</strong></p>
          <p className="hook-line">XIV Exhibition / Final check</p>
          <h1>Ah, there<br /><em>you</em> are.</h1>
          <p className="opening-role"><b>The XIV Exhibition opens today.</b><span>Klinger’s Beethoven, Klimt’s frieze and Hoffmann’s rooms are meant to become one experience. You’re here for the final check.</span></p>
          <button className="invitation" type="button" onClick={enterThreshold}>
            Come in. The final check is waiting.
          </button>
        </div>
        <aside className="experience-mark" aria-label="Experience context">
          <span>Before the doors open</span>
          <span>XIV Exhibition</span>
          <span>Vienna Secession</span>
        </aside>
        <button className="threshold" type="button" aria-label="Enter the Vienna Secession" onClick={enterThreshold} disabled={stage !== 'outside'}>
          <span className="threshold__portal" aria-hidden="true"><i /><i /><i /></span>
          <span className="threshold__label"><b>Final check</b>Enter</span>
        </button>
      </section>

      <section className="passage" aria-label="Your role before entering" aria-hidden={stage !== 'threshold'}>
        <span /><span /><span />
        <article className="passage-brief">
          <p>Vienna Secession / 15 April 1902</p>
          <h2>Before the public arrives, you are part of the exhibition team.</h2>
          <div className="passage-brief__grid">
            <div><b>Your role</b><span>Help with the final preparations for the XIV Exhibition.</span></div>
            <div><b>What you will do</b><span>Inspect a letter, understand the rooms and move through Klimt’s Beethoven Frieze.</span></div>
            <div><b>What you will learn</b><span>How logistics, architecture and art came together — and why something temporary survived.</span></div>
          </div>
          <button type="button" onClick={beginRoom}>Begin the final check <i>→</i></button>
        </article>
      </section>

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
          <h2>You’re here.<em>Good.</em></h2>
          <p className="interior__line">There are still a few things to sort out.</p>
          <p className="helper-role">The public arrives later. For now, you’re helping with the final preparations.</p>
          <button className="interior-reveal" type="button" onClick={() => { soundCue('room'); setInteriorRevealed(true); }}>Enter the room <i>→</i></button>
        </div>
        <nav className="attention" aria-label="Areas in the room">
          <p className="attention__prompt"><b>Your final check</b><span>Choose where to begin. Each area reveals a different decision behind opening day.</span></p>
          <button className="attention__item attention__item--letters" type="button" onClick={() => setFocus('letter')}>
            <i /><span><b>Correspondence</b><small>Inspect the letter from Dresden</small></span>
          </button>
          <button className="attention__item attention__item--rooms" type="button" onClick={() => { setModelRevealed(false); setFocus('rooms'); }}>
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
          <details className="context-note">
            <summary><b>Why / Learn</b><span>What this letter changes</span></summary>
            <div><p>The exhibition was also a practical undertaking. Works had to travel, correspondence had to arrive, invitations had to be sent and prices had to be decided.</p>
            <p>This is not a fictional emergency. The uncertainty documented in Ernst Arnold’s letter is enough: five days before opening, transport and money were still part of the work.</p>
            <p>In the correspondence, “Beethoven” is shorthand for Max Klinger’s monumental sculpture of the composer — a polychrome work in bronze and marble, and the physical centre of the exhibition.</p>
            <strong>What you learn</strong><span>An exhibition is made through logistics, money and human decisions as well as art.</span></div>
          </details>
          <button className="chapter-link" type="button" onClick={() => setFocus('rooms')}>Look at the rooms</button>
        </article>
        <button className="chapter-close" type="button" onClick={() => setFocus(null)} aria-label="Return to the preparation room">×</button>
      </section>

      <section className={`chapter chapter--rooms ${focus === 'rooms' ? 'is-open' : ''} ${modelRevealed ? 'model-revealed' : ''} ${roomEntering ? 'is-entering' : ''}`} aria-hidden={focus !== 'rooms'}>
        <button className="room-image-action" type="button" onClick={enterKlimtRoom} aria-label="Move through the wall opening into Klimt’s room">
          <img className="chapter__art room-model-art" src="/images/spatial-model-v1.png" alt="An abstract hand-drawn model showing the left side hall opening toward Klinger’s Beethoven" />
        </button>
        <article className="rooms-copy">
          <p className="chapter-kicker">The rooms</p>
          <p className="worker-cue"><b>What to do</b><span>Select the drawn room and move through the wall opening toward Klinger’s statue.</span></p>
          <h3>Make the room make sense.</h3>
          <p>Painting. Sculpture. Architecture.</p>
          <p>Designed to be experienced together.</p>
          <details className="context-note">
            <summary><b>Why / Learn</b><span>Why this viewpoint matters</span></summary>
            <div><p>Under Josef Hoffmann’s direction, twenty-one artists shaped one exhibition. Klinger’s statue stood in the main hall, Klimt’s frieze in the left side hall, and a wall opening connected both views.</p>
            <strong>What you learn</strong><span>Gesamtkunstwerk here is spatial: painting, sculpture and architecture shape one experience.</span></div>
          </details>
          <button className="chapter-link model-reveal" type="button" onClick={() => setModelRevealed(true)}>Inspect the model</button>
        </article>
        <div className="room-control">
          <div className="view-step"><b>Frieze → Opening → Beethoven</b><span>The architecture keeps painting and sculpture in one field of view.</span></div>
          <button className="chapter-link room-enter" type="button" onClick={enterKlimtRoom}>Move through the opening</button>
        </div>
        <button className="chapter-close" type="button" onClick={() => setFocus(null)} aria-label="Return to the preparation room">×</button>
      </section>

      <section className={`chapter chapter--frieze ${focus === 'frieze' ? 'is-open' : ''} ${friezeIndex === 4 ? 'frieze-climax' : ''}`} aria-hidden={focus !== 'frieze'} style={{'--frieze': friezePosition} as React.CSSProperties}>
        <div className="frieze-threshold" aria-hidden="true"><span>Painting.</span><span>Sculpture.</span><span>Architecture.</span></div>
        <div className="frieze-pan"
          onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.classList.add('is-dragging'); friezeDrag.current = { x: event.clientX, position: friezePosition }; }}
          onPointerMove={(event) => { const drag = friezeDrag.current; if (!drag) return; event.preventDefault(); setFriezePosition(Math.min(4, Math.max(0, drag.position + (drag.x - event.clientX) / window.innerWidth * 5))); }}
          onPointerUp={(event) => { friezeDrag.current = null; event.currentTarget.classList.remove('is-dragging'); event.currentTarget.releasePointerCapture(event.pointerId); }}
          onPointerCancel={(event) => { friezeDrag.current = null; event.currentTarget.classList.remove('is-dragging'); }}
          onWheel={(event) => { event.preventDefault(); const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY; setFriezePosition((position) => Math.min(4, Math.max(0, position + delta / 360))); }}>
          <img className="chapter__art" src="/images/beethoven-frieze-v1.png" alt="An original hand-drawn abstract interpretation of the Beethoven Frieze" draggable="false" onDragStart={(event) => event.preventDefault()} />
          <div className="kiss-focus" aria-hidden="true"><i /><b>The kiss</b></div>
        </div>
        <div className="frieze-copy">
          <p className="worker-cue worker-cue--frieze"><b>Drag to move</b><span>Follow the wall from left to right.</span></p>
          <p>{['A search for happiness.', 'Resistance.', 'Desire.', 'The arts.', 'And finally — a kiss.'][friezeIndex]}</p>
          <details className="context-note context-note--frieze">
            <summary><b>Why / Learn</b><span>Why this room matters</span></summary>
            <div><p>The exhibition honoured Ludwig van Beethoven on the seventy-fifth anniversary of his death. Around 1900 he was revered as the gifted artist who suffers yet creates something universal.</p>
            <p>Klimt turned the human search for happiness — inspired by Beethoven’s Ninth Symphony — into a procession across three walls. The final kiss answers the struggle that comes before it.</p>
            <p>The frieze was conceived for this exhibition, not as an isolated permanent mural. Its rhythm, scale and procession belonged to Hoffmann’s temporary architecture and to the encounter with Klinger’s sculpture.</p>
            <strong>What you learn</strong><span>The frieze changes meaning when it is experienced as a route through a specific room.</span></div>
          </details>
          <div className="frieze-controls" aria-label="Move through the frieze">
            <span>0{friezeIndex + 1} / 05</span>
            {friezePosition > .2 && <button type="button" onClick={() => setFriezePosition(Math.max(0, friezeIndex - 1))}>←</button>}
            {friezePosition < 3.8 && <button type="button" onClick={() => setFriezePosition(Math.min(4, friezeIndex + 1))}>→</button>}
          </div>
          {friezePosition > 3.75 && <div className="frieze-reveal"><span>This room was made for this exhibition.</span><small>The frieze was conceived as part of something temporary.</small><button type="button" onClick={() => setFocus('invitation')}>Final preparations →</button></div>}
        </div>
        <button className="chapter-close chapter-close--light" type="button" onClick={() => setFocus(null)} aria-label="Return to the preparation room">×</button>
      </section>

      <section className={`chapter chapter--invitation ${focus === 'invitation' ? 'is-open' : ''}`} aria-hidden={focus !== 'invitation'}>
        <img className="chapter__art" src="/images/correspondence-terey-v1.png" alt="A hand-drawn reconstructed letter, invitation and addressed envelope" />
        <article className="invitation-copy">
          <span className="reconstruction">Reconstructed from archival correspondence</span>
          <p className="chapter-kicker">12 April 1902 · Budapest → Vienna</p>
          <h3>People are already travelling to Vienna.</h3>
          <p>Dr. Gabriel von Térey will attend the opening.</p>
          <p>He asks for one additional invitation.</p>
          <p>The cards should be sent to Hotel Kaiserhof.</p>
          <div className="ending-cue"><b>What this changes</b><span>The unfinished exhibition is about to become public.</span></div>
          <button className="chapter-link" type="button" onClick={() => { setDoorsOpen(false); setFocus('doors'); }}>Return to the prepared room</button>
        </article>
      </section>

      <section className={`chapter chapter--doors ${focus === 'doors' ? 'is-open' : ''} ${doorsOpen ? 'is-opening' : ''}`} aria-hidden={focus !== 'doors'}>
        <img className="doors-room" src="/images/secession-interior-v4.png" alt="The prepared exhibition room" />
        <div className="door-leaf door-leaf--left" aria-hidden="true" />
        <div className="door-leaf door-leaf--right" aria-hidden="true" />
        <div className="doors-copy">
          <span>The room is calm. Movement gathers outside.</span>
          <h3>The doors are about to open.</h3>
          <button type="button" onClick={openDoors}>Open the doors</button>
        </div>
      </section>

      <section className={`chapter chapter--epilogue ${focus === 'epilogue' ? 'is-open' : ''}`} aria-hidden={focus !== 'epilogue'}>
        <div className="visitors-number"><strong>58,000</strong><span>people visited the XIV Exhibition.</span><small>It became one of the Secession’s greatest public successes.</small></div>
        <div className="gold-afterline" aria-hidden="true" />
        <div className="memory-echo" aria-hidden="true"><img src="/images/secession-exterior-v8.png" alt="" /><img src="/images/secession-interior-v4.png" alt="" /><img src="/images/beethoven-frieze-v1.png" alt="" /></div>
        <article className="afterlife-copy">
          <span className="completion-stamp">Final preparations complete</span>
          <h3>The doors<br /><em>are open.</em></h3>
          <p>The exhibition ended. The rooms changed. <em>The Beethoven Frieze survived.</em></p>
          <div className="today-note"><b>Vienna, today</b><span>You can still walk into that room.</span></div>
          <div className="takeaway"><b>What you carry out</b><span>Exhibitions are built through people and practical decisions.</span><span>Meaning emerges between art, architecture and movement.</span><span>Something conceived as temporary can survive.</span></div>
          <nav><a href="https://secession.at/beethovenfrieze" target="_blank" rel="noreferrer">Enter Vienna today →</a><details><summary>Sources / method</summary><p>This experience is based on archival material relating to the XIV Exhibition of the Vienna Secession in 1902. Historical events, dates and correspondence have been adapted for an interactive format. Reconstructed documents, visual environments and narrative transitions are original interpretations by Salon Format.</p></details><button type="button" onClick={replay}>Experience again</button></nav>
        </article>
      </section>
    </main>
  );
}
