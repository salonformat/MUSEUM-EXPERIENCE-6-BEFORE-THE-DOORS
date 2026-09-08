'use client';

import { useEffect, useRef, useState } from 'react';

type Stage = 'outside' | 'threshold' | 'inside';
type Focus = null | 'letter' | 'rooms' | 'frieze' | 'invitation' | 'walkthrough' | 'doors' | 'epilogue';

export default function Home() {
  const asset = (file: string) => `${import.meta.env.BASE_URL}images/${file}`;
  const [stage, setStage] = useState<Stage>('outside');
  const [introSkipped, setIntroSkipped] = useState(false);
  const [focus, setFocus] = useState<Focus>(null);
  const [friezePosition, setFriezePosition] = useState(0);
  const [roomEntering, setRoomEntering] = useState(false);
  const [interiorRevealed, setInteriorRevealed] = useState(false);
  const [modelRevealed, setModelRevealed] = useState(false);
  const [letterHeadFound, setLetterHeadFound] = useState(false);
  const [letterPriceFound, setLetterPriceFound] = useState(false);
  const [letterComplete, setLetterComplete] = useState(false);
  const [roomView, setRoomView] = useState(18);
  const [roomComplete, setRoomComplete] = useState(false);
  const [tereyPacked, setTereyPacked] = useState(false);
  const [beerPacked, setBeerPacked] = useState(false);
  const [dispatchSent, setDispatchSent] = useState(false);
  const [friezeSeen, setFriezeSeen] = useState<number[]>([]);
  const [walkthroughChecks, setWalkthroughChecks] = useState<string[]>([]);
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const friezeDrag = useRef<{ x: number; position: number } | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const audioMaster = useRef<GainNode | null>(null);
  const climaxPlayed = useRef(false);
  const publicAmbience = useRef<HTMLAudioElement | null>(null);
  const workroomAmbience = useRef<HTMLAudioElement | null>(null);
  const friezeIndex = Math.min(4, Math.max(0, Math.round(friezePosition)));
  const friezeStages = ['The search', 'Resistance', 'Desire', 'The arts', 'The kiss'];
  const friezeMarkers = [{x:28,y:43},{x:48,y:39},{x:62,y:49},{x:58,y:34},{x:75,y:42}];
  const friezeComplete = friezePosition >= 3.94 && friezeSeen.length === 5;
  const completedCount = Number(letterComplete) + Number(roomComplete) + Number(friezeComplete);
  const inspectionComplete = completedCount === 3;
  const systemLabel = focus === 'letter' ? 'correspondence' : focus === 'rooms' ? 'the rooms' : focus === 'frieze' ? 'the frieze' : focus === 'invitation' ? 'invitation' : focus === 'walkthrough' ? 'final walk-through' : focus === 'doors' ? 'opening' : focus === 'epilogue' ? 'afterlife' : stage === 'threshold' ? 'briefing' : 'workroom';
  const systemNumber = focus === 'letter' ? '01' : focus === 'rooms' ? '02' : focus === 'frieze' ? '03' : focus === 'invitation' ? '04' : focus === 'doors' || focus === 'epilogue' ? '05' : '00';

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
  const beginRoom = () => {
    soundCue('room');
    if (workroomAmbience.current && soundEnabled) {
      workroomAmbience.current.volume = .16;
      void workroomAmbience.current.play().catch(() => undefined);
    }
    setInteriorRevealed(false);
    setStage('inside');
  };

  useEffect(() => {
    if (stage !== 'inside' || interiorRevealed) return;
    const roomArrival = window.setTimeout(() => setInteriorRevealed(true), 2350);
    return () => window.clearTimeout(roomArrival);
  }, [stage, interiorRevealed]);

  const enterKlimtRoom = () => {
    if (roomEntering) return;
    soundCue('passage');
    setRoomEntering(true);
    window.setTimeout(() => {
      setFocus('frieze');
      setRoomEntering(false);
    }, 1250);
  };

  const moveViewpoint = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!modelRevealed) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setRoomView(Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)));
  };

  const inspectWorkroom = (event: React.PointerEvent<HTMLElement>) => {
    if (focus) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    event.currentTarget.style.setProperty('--room-x', `${x * 100}%`);
    event.currentTarget.style.setProperty('--room-y', `${y * 100}%`);
    event.currentTarget.style.setProperty('--room-mx', `${(x - .5) * -18}px`);
    event.currentTarget.style.setProperty('--room-my', `${(y - .5) * -12}px`);
    event.currentTarget.style.setProperty('--room-back-x', `${(x - .5) * 6}px`);
    event.currentTarget.style.setProperty('--room-back-y', `${(y - .5) * 4}px`);
  };

  const markFriezeStage = () => {
    soundCue(friezeIndex === 4 ? 'climax' : 'frieze');
    setFriezeSeen((seen) => seen.includes(friezeIndex) ? seen : [...seen, friezeIndex]);
  };

  const dispatchInvitations = () => {
    soundCue('paper');
    setDispatchSent(true);
    window.setTimeout(() => {
      setLetterComplete(true);
      setFocus(null);
    }, 3400);
  };

  const toggleWalkthrough = (item: string) => {
    soundCue('room');
    setWalkthroughChecks((checks) => checks.includes(item) ? checks : [...checks, item]);
  };

  const goBack = () => {
    if (focus === 'epilogue') return setFocus('doors');
    if (focus === 'doors') return setFocus('walkthrough');
    if (focus === 'walkthrough') return setFocus(null);
    if (focus === 'invitation') return setFocus('letter');
    if (focus) return setFocus(null);
    if (stage === 'inside') return setStage('threshold');
    if (stage === 'threshold') return setStage('outside');
    if (introSkipped) setIntroSkipped(false);
  };

  const openDoors = () => {
    if (doorsOpen) return;
    soundCue('doors');
    const ambience = publicAmbience.current;
    if (ambience && soundEnabled) {
      ambience.volume = 0;
      ambience.currentTime = 3;
      void ambience.play().catch(() => undefined);
      const started = performance.now();
      const fade = (now: number) => {
        if (!publicAmbience.current) return;
        publicAmbience.current.volume = Math.min(.28, ((now - started) / 3200) * .28);
        if (now - started < 3200) requestAnimationFrame(fade);
      };
      requestAnimationFrame(fade);
    }
    setDoorsOpen(true);
    window.setTimeout(() => setFocus('epilogue'), 1700);
  };

  const downloadInspectionRecord = () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600"><rect width="1200" height="1600" fill="#F1EBDD"/><path d="M0 0H1200V185L0 315Z" fill="#2520E8"/><text x="80" y="120" fill="#F1EBDD" font-family="Arial,sans-serif" font-size="25" letter-spacing="7">SALON FORMAT · IMMERSIVE CULTURAL EXPERIENCE</text><text x="80" y="430" fill="#201D1A" font-family="Georgia,serif" font-size="88">FINAL</text><text x="80" y="520" fill="#201D1A" font-family="Georgia,serif" font-size="88">INSPECTION RECORD</text><text x="82" y="600" fill="#A98235" font-family="Arial,sans-serif" font-size="26" letter-spacing="5">VIENNA SECESSION · 15 APRIL 1902</text><line x1="80" y1="665" x2="1120" y2="665" stroke="#201D1A" stroke-width="3"/><g font-family="Arial,sans-serif" font-size="30" letter-spacing="3"><rect x="80" y="735" width="1040" height="145" fill="#201D1A"/><text x="125" y="825" fill="#F1EBDD">01  CORRESPONDENCE CLEARED</text><rect x="80" y="910" width="1040" height="145" fill="#47716D"/><text x="125" y="1000" fill="#F1EBDD">02  SIGHTLINE CONFIRMED</text><rect x="80" y="1085" width="1040" height="145" fill="#A98235"/><text x="125" y="1175" fill="#201D1A">03  FRIEZE ROUTE COMPLETE</text></g><text x="80" y="1335" fill="#201D1A" font-family="Georgia,serif" font-size="42">The exhibition is ready.</text><text x="80" y="1400" fill="#6B2F2B" font-family="Arial,sans-serif" font-size="24" letter-spacing="4">THE PUBLIC CAN ENTER NOW.</text><text x="80" y="1510" fill="#201D1A" font-family="Arial,sans-serif" font-size="20" letter-spacing="4">A SALON FORMAT RECONSTRUCTION · SALONFORMAT.COM</text></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type:'image/svg+xml' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'before-the-doors-open-final-inspection-record.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  const replay = () => {
    window.location.reload();
  };

  useEffect(() => {
    if (audioMaster.current && audioContext.current) {
      audioMaster.current.gain.setTargetAtTime(soundEnabled ? .16 : 0, audioContext.current.currentTime, .08);
    }
    if (publicAmbience.current) publicAmbience.current.volume = soundEnabled && doorsOpen ? .28 : 0;
    if (workroomAmbience.current) workroomAmbience.current.volume = soundEnabled && stage === 'inside' && !doorsOpen ? .16 : 0;
  }, [soundEnabled, doorsOpen, stage]);

  useEffect(() => {
    if (focus !== 'frieze') return;
    if (friezeComplete && !climaxPlayed.current) { climaxPlayed.current = true; soundCue('climax'); }
  }, [focus, friezeComplete]);

  useEffect(() => {
    if (focus !== 'rooms' || roomView < 72) return;
    if (!roomComplete) { setRoomComplete(true); soundCue('room'); }
    const done = window.setTimeout(() => setFocus(null), 2200);
    return () => window.clearTimeout(done);
  }, [focus, roomView, roomComplete]);

  useEffect(() => {
    if (focus !== 'letter' || !letterHeadFound || !letterPriceFound) return;
    soundCue('paper');
    const advance = window.setTimeout(() => setFocus('invitation'), 1650);
    return () => window.clearTimeout(advance);
  }, [focus, letterHeadFound, letterPriceFound]);

  useEffect(() => {
    if (focus !== 'frieze' || !friezeComplete) return;
    const done = window.setTimeout(() => setFocus(null), 3400);
    return () => window.clearTimeout(done);
  }, [focus, friezeComplete]);

  useEffect(() => {
    if (focus !== 'frieze' || !friezeSeen.includes(friezeIndex) || friezeIndex >= 4) return;
    const advance = window.setTimeout(() => setFriezePosition(friezeIndex + 1), 480);
    return () => window.clearTimeout(advance);
  }, [focus, friezeIndex, friezeSeen]);

  const moveScene = (event: React.PointerEvent<HTMLElement>) => {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    event.currentTarget.style.setProperty('--mx', x.toFixed(3));
    event.currentTarget.style.setProperty('--my', y.toFixed(3));
    event.currentTarget.style.setProperty('--px', `${event.clientX}px`);
    event.currentTarget.style.setProperty('--py', `${event.clientY}px`);
    const doorX = window.innerWidth * (window.innerWidth <= 760 ? .703 : .655);
    const doorY = window.innerHeight * (window.innerWidth <= 760 ? .875 : .83);
    const distance = Math.hypot(event.clientX - doorX, event.clientY - doorY);
    const proximity = Math.max(0, Math.min(1, 1 - distance / (window.innerWidth * .42)));
    event.currentTarget.style.setProperty('--door-proximity', proximity.toFixed(3));
  };

  return (
    <main className={`experience stage-${stage} ${interiorRevealed ? 'interior-revealed' : ''}`} onPointerMove={moveScene}>
      <audio ref={publicAmbience} src={`${import.meta.env.BASE_URL}audio/museum-gallery-ambience-cc0.mp3`} loop preload="auto" />
      <audio ref={workroomAmbience} src={`${import.meta.env.BASE_URL}audio/empty-museum-footsteps-cc0.mp3`} loop preload="auto" />
      <div className="cursor-mark" aria-hidden="true" />
      <nav className="global-navigation" aria-label="Experience navigation">
        {(introSkipped || stage !== 'outside' || focus) && <button type="button" onClick={goBack}><i>←</i><span>Back</span></button>}
        <a href="https://salonformat.com" target="_blank" rel="noreferrer">Salon Format</a>
      </nav>
      <button className="sound-toggle" type="button" onClick={() => setSoundEnabled((enabled) => !enabled)} aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}><i aria-hidden="true" />{soundEnabled ? 'Sound on' : 'Sound off'}</button>
      <aside className="work-ledger" aria-live="polite"><i /><span>Opening day · final inspection</span><b>{systemLabel}</b><small>{completedCount} / 3 ready</small></aside>
      <div className={`opening-slate ${introSkipped ? 'is-skipped' : ''}`}>
        <span>An immersive cultural experience</span>
        <div className="opening-glimpse"><img src={asset('secession-exterior-v10.png')} alt="" /><i /><i /></div>
        <h1 className="prologue-title"><span>Before</span><em>the doors</em><strong>open.</strong></h1>
        <p><strong>The XIV Exhibition opens today.</strong> German artist Max Klinger’s monumental Beethoven sculpture stands at its centre. Klimt’s frieze and Josef Hoffmann’s spatial design were created around it. Step into the exhibition team’s final check.<br /><em>Vienna, 15 April 1902 — before the public arrives.</em></p>
        <div className="opening-slate__modes"><i>Sound</i><i>Movement</i><i>Archival reconstruction</i></div>
        <button className="skip-prologue" type="button" onClick={() => setIntroSkipped(true)}><small>Begin in Vienna · 15 April 1902</small><b>Enter the experience</b><i>→</i></button>
      </div>
      <section className="exterior" aria-label="Vienna Secession, 15 April 1902" aria-hidden={stage === 'inside'}>
        <div className="exterior__art" aria-hidden="true">
          <img src={`${asset('secession-exterior-v10.png')}?v=full-ultramarine`} alt="" draggable="false" />
        </div>
        <div className="dome-glint" aria-hidden="true" />
        <div className="door-aura" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
        <div className="exterior__copy">
          <p className="dateline"><span>Vienna</span><span>15 April</span><strong>1902</strong></p>
          <p className="hook-line">XIV Exhibition / Final check</p>
          <h1><span>Ah, there</span><em>You are.</em></h1>
          <div className="opening-role">
            <p className="opening-role__edition">The XIV Exhibition opens today.</p>
            <p className="opening-role__names"><span>Klinger</span><span>Klimt</span><span>Hoffmann</span></p>
            <p className="opening-role__task"><b>Your role</b><span>You’re part of the exhibition team — and responsible for the final check before the public arrives.</span></p>
          </div>
        </div>
        <aside className="experience-mark" aria-label="Experience context">
          <span>Before the doors open</span>
          <span>XIV Exhibition</span>
          <span>Vienna Secession</span>
        </aside>
        <button className="threshold" type="button" aria-label="Open the entrance door of the Vienna Secession" onClick={enterThreshold} disabled={stage !== 'outside'}>
          <span className="threshold__portal" aria-hidden="true"><i /><i /><i /></span>
        </button>
        <button className="entry-cue" type="button" onClick={enterThreshold} disabled={stage !== 'outside'}>
          <b>Open the door <i>→</i></b><small>Continue through the dark entrance</small>
        </button>
      </section>

      <section className="passage" aria-label="Your role before entering" aria-hidden={stage !== 'threshold'}>
        <span /><span /><span />
        <article className="passage-brief">
          <p>Your briefing / XIV Exhibition</p>
          <h2>The public arrives later today.</h2>
          <p className="passage-brief__lead">Before the doors open, the exhibition team needs three final checks from you. Each one connects to Max Klinger’s monumental Beethoven sculpture at the centre of the exhibition.</p>
          <div className="passage-brief__grid">
            <div><strong>01</strong><b>Review the Dresden letter</b><span>Art dealer Ernst Arnold writes about Klinger’s dispatch. Mark the delayed marble head and an unanswered price request.</span></div>
            <div><strong>02</strong><b>Inspect the room model</b><span>Find the wall opening that connects Klimt’s painted room with the view of Klinger’s Beethoven statue.</span></div>
            <div><strong>03</strong><b>Complete the frieze check</b><span>Move through all five stages — from the search for happiness to the final kiss.</span></div>
          </div>
          <footer><span>By opening time, you will understand how logistics, architecture and art became one experience — and why something temporary survived.</span><button className="workroom-entry" type="button" onClick={beginRoom}><small>Briefing received</small><b><em>Enter</em><span>the workroom</span></b><i>→</i></button></footer>
        </article>
      </section>

      <section className={`interior ${letterComplete ? 'has-correspondence' : ''} ${roomComplete ? 'has-sightline' : ''} ${friezeComplete ? 'has-frieze' : ''}`} aria-label="Inside the Vienna Secession" aria-hidden={stage !== 'inside'} onPointerMove={inspectWorkroom}>
        <div className="interior__architecture" aria-hidden="true">
          <img className="interior-art" src={`${asset('secession-interior-v4.png')}?v=controlled-ink`} alt="" draggable="false" />
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
        <div className="workroom-lens" aria-hidden="true" />
        <div className="interior__copy">
          <span className="room-number">15 April 1902 / Before opening</span>
          <h2>You’re here.<em>Good.</em></h2>
          <p className="interior__line">There are still a few things to sort out.</p>
          <p className="helper-role">Opening day. Three preparations must be cleared before the public enters. Begin wherever you like.</p>
          <span className="room-arrival-cue"><i />The room is coming into view</span>
        </div>
        <nav className="attention" aria-label="Areas in the room">
          <p className="attention__prompt"><b>{inspectionComplete ? 'The room is ready for its final walk-through.' : `${3 - completedCount} preparation${3 - completedCount === 1 ? '' : 's'} unresolved.`}</b><span>{inspectionComplete ? 'Inspect the completed room once more, then release it to the public.' : 'Move your pointer through the drawing. Choose any glowing work point; every completed check changes this room.'}</span></p>
          <button className="attention__item attention__item--letters" type="button" onClick={() => setFocus('letter')}>
            <i /><span><b>The Dresden letter {letterComplete && '✓'}</b><small>Resolve two open follow-ups</small></span>
          </button>
          <button className="attention__item attention__item--rooms" type="button" onClick={() => { setModelRevealed(false); setFocus('rooms'); }}>
            <i /><span><b>The sightline {roomComplete && '✓'}</b><small>Test the view through the wall opening</small></span>
          </button>
          <button className={`attention__item attention__item--frieze ${friezeComplete ? 'is-cleared' : ''}`} type="button" onClick={() => setFocus('frieze')}>
            <i /><span><b>The frieze {friezeComplete && '✓'}</b><small>Follow and verify its five stages</small></span>
          </button>
          {inspectionComplete && <button className="final-walkthrough-entry" type="button" onClick={() => setFocus('walkthrough')}><small>3 / 3 preparations ready</small><b>Begin final walk-through</b><i>→</i></button>}
        </nav>
      </section>

      <section className={`chapter chapter--letter ${focus === 'letter' ? 'is-open' : ''}`} aria-hidden={focus !== 'letter'}>
        <img className="chapter__art" src={asset('correspondence-arnold-v1.png')} alt="A hand-drawn reconstructed letter with two telegram slips" />
        <div className="document-hotspots" aria-label="Inspect the archival reconstruction">
          <button className={letterHeadFound ? 'is-found' : ''} type="button" onClick={() => { soundCue('paper'); setLetterHeadFound(true); }}><span>Transport</span><b>{letterHeadFound ? 'Delayed marble head marked ✓' : 'Find the delayed dispatch'}</b></button>
          <button className={letterPriceFound ? 'is-found' : ''} type="button" onClick={() => { soundCue('paper'); setLetterPriceFound(true); }}><span>Price</span><b>{letterPriceFound ? 'Unanswered price marked ✓' : 'Find the unanswered request'}</b></button>
        </div>
        <div className="chapter__veil" />
        <article className="document-copy">
          <span className="reconstruction">Reconstructed from archival correspondence</span>
          <p className="worker-cue"><b>Your task</b><span>Open the reconstructed document and locate two unresolved points: the delayed transport and the unanswered price request.</span></p>
          <p className="chapter-kicker">10 April 1902 · Dresden → Vienna</p>
          <h3>The marble head is delayed.</h3>
          <p>Max Klinger meant to send the marble head with his monumental Beethoven sculpture, but the dispatch was delayed.</p>
          <p>Two telegrams have already been sent.</p>
          <p>And one more question: what sale price is being asked for Klinger’s Beethoven sculpture?</p>
          <div className="letter-checks" aria-label="Open points in the letter">
            <button className={letterHeadFound ? 'is-found' : ''} type="button" onClick={() => { soundCue('paper'); setLetterHeadFound(true); }}><i />Open point 01<span>{letterHeadFound ? 'Marble head marked ✓' : 'Mark the delayed marble head'}</span></button>
            <button className={letterPriceFound ? 'is-found' : ''} type="button" onClick={() => { soundCue('paper'); setLetterPriceFound(true); }}><i />Open point 02<span>{letterPriceFound ? 'Price request marked ✓' : 'Mark Klinger’s unanswered price request'}</span></button>
          </div>
          <details className="context-note">
            <summary><b>Why / Learn</b><span>What this letter changes</span></summary>
            <div><p>The exhibition was also a practical undertaking. Works had to travel, correspondence had to arrive, invitations had to be sent and prices had to be decided.</p>
            <p>This is not a fictional emergency. The uncertainty documented in Ernst Arnold’s letter is enough: five days before opening, transport and money were still part of the work.</p>
            <p>In the correspondence, “Beethoven” is shorthand for Max Klinger’s monumental sculpture of the composer — a polychrome work in bronze and marble, and the physical centre of the exhibition.</p>
            <strong>What you learn</strong><span>An exhibition is made through logistics, money and human decisions as well as art.</span></div>
          </details>
          {letterHeadFound && letterPriceFound ? <div className="auto-complete auto-complete--letter"><i>✓</i><b>2 / 2 open points found</b><span>Opening the invitation dispatch…</span></div> : <p className="check-progress">Next: locate and mark both open points on the document.</p>}
        </article>
        <button className="chapter-close" type="button" onClick={() => setFocus(null)} aria-label="Return to the preparation room">×</button>
      </section>

      <section className={`chapter chapter--rooms ${focus === 'rooms' ? 'is-open' : ''} ${modelRevealed ? 'model-revealed' : ''} ${roomEntering ? 'is-entering' : ''}`} aria-hidden={focus !== 'rooms'} style={{'--room-view': roomView} as React.CSSProperties}>
        <div className="room-image-action" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); moveViewpoint(event); }} onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) moveViewpoint(event); }} onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}>
          <img className="chapter__art room-model-art" src={asset('spatial-model-v1.png')} alt="An abstract hand-drawn model showing the left side hall opening toward Klinger’s Beethoven" />
          {modelRevealed && <div className={`sightline-viewfinder ${roomView >= 72 ? 'is-aligned' : ''}`} style={{'--view-x':`${22 + roomView * .3}%`} as React.CSSProperties} aria-hidden="true"><i /><span /></div>}
          {modelRevealed && <div className={`room-opening-hotspot ${roomView >= 72 ? 'is-aligned' : ''}`}><i aria-hidden="true" /><b>Wall opening</b><span>{roomView >= 72 ? 'Sightline confirmed' : 'Adjust the viewpoint'}</span></div>}
        </div>
        <article className="rooms-copy">
          <p className="chapter-kicker">The rooms</p>
          <p className="worker-cue"><b>Your task</b><span>Drag directly across the drawn room to change your position. Stop when Klinger’s statue sits clearly inside the wall opening.</span></p>
          <h3>Make the room make sense.</h3>
          <p>Painting. Sculpture. Architecture.</p>
          <p>Designed to be experienced together.</p>
          <details className="context-note">
            <summary><b>Why / Learn</b><span>Why this viewpoint matters</span></summary>
            <div><p>Under Josef Hoffmann’s direction, twenty-one artists shaped one exhibition. Klinger’s statue stood in the main hall, Klimt’s frieze in the left side hall, and a wall opening connected both views.</p>
            <strong>What you learn</strong><span>Gesamtkunstwerk here is spatial: painting, sculpture and architecture shape one experience.</span></div>
          </details>
          <button className="chapter-link model-reveal setup-action" type="button" onClick={() => { soundCue('room'); setModelRevealed(true); }}><small>Begin check 02</small>Start the sightline test →</button>
        </article>
        <div className="room-control">
          <div className="view-step"><b>{roomView >= 72 ? 'Sightline confirmed' : 'Adjust the viewpoint'}</b><span>{roomView >= 72 ? 'Painting, sculpture and architecture now connect in one view.' : 'Move the control until the statue sits clearly inside the wall opening.'}</span></div>
          <label className="sightline-control"><span>Outside the view</span><input aria-label="Adjust viewpoint" type="range" min="0" max="100" value={roomView} onInput={(event) => setRoomView(Number(event.currentTarget.value))} /><span>In one view</span></label>
          {roomView >= 72 ? <div className="auto-complete"><i>✓</i><b>Sightline confirmed</b><span>Returning to the workroom…</span></div> : <span className="room-control__hint">Drag across the room—or use the control—until the statue is framed.</span>}
        </div>
        <button className="chapter-close" type="button" onClick={() => setFocus(null)} aria-label="Return to the preparation room">×</button>
      </section>

      <section className={`chapter chapter--frieze ${focus === 'frieze' ? 'is-open' : ''} ${friezeComplete ? 'frieze-climax' : ''}`} aria-hidden={focus !== 'frieze'} style={{'--frieze': friezePosition} as React.CSSProperties}>
        <div className="frieze-threshold" aria-hidden="true"><span>Painting.</span><span>Sculpture.</span><span>Architecture.</span></div>
        <div className="frieze-pan"
          onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.classList.add('is-dragging'); friezeDrag.current = { x: event.clientX, position: friezePosition }; }}
          onPointerMove={(event) => { const drag = friezeDrag.current; if (!drag) return; event.preventDefault(); setFriezePosition(Math.min(4, Math.max(0, drag.position + (drag.x - event.clientX) / window.innerWidth * 5))); }}
          onPointerUp={(event) => { friezeDrag.current = null; event.currentTarget.classList.remove('is-dragging'); event.currentTarget.releasePointerCapture(event.pointerId); }}
          onPointerCancel={(event) => { friezeDrag.current = null; event.currentTarget.classList.remove('is-dragging'); }}
          onWheel={(event) => { event.preventDefault(); const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY; setFriezePosition((position) => Math.min(4, Math.max(0, position + delta / 360))); }}>
          <img className="chapter__art" src={asset('beethoven-frieze-v2.png')} alt="A visibly hand-drawn abstract interpretation of the Beethoven Frieze, from human longing through hostile forces to the golden conclusion" draggable="false" onDragStart={(event) => event.preventDefault()} />
          <button className={`frieze-object-marker ${friezeSeen.includes(friezeIndex) ? 'is-marked' : ''}`} style={{'--marker-x':`${friezeMarkers[friezeIndex].x}%`,'--marker-y':`${friezeMarkers[friezeIndex].y}%`} as React.CSSProperties} type="button" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); markFriezeStage(); }} aria-label={`${friezeSeen.includes(friezeIndex) ? 'Marked' : 'Inspect'} ${friezeStages[friezeIndex]}`}><i /><span>{friezeStages[friezeIndex]}</span><b>{friezeSeen.includes(friezeIndex) ? 'Marked ✓' : 'Move here · click to mark'}</b></button>
          {friezeComplete && <div className="kiss-focus" aria-hidden="true"><i /><b>The kiss</b></div>}
        </div>
        <div className="frieze-copy">
          <p className="worker-cue worker-cue--frieze"><b>{friezeSeen.includes(friezeIndex) ? `Stage ${friezeIndex + 1} marked ✓` : `Stage ${friezeIndex + 1} of 5`}</b><span>{friezeSeen.includes(friezeIndex) ? (friezeIndex < 4 ? 'The wall is moving to the next stage…' : 'The complete route is now revealing its conclusion.') : 'Find the softly glowing mark in the drawing and click it.'}</span></p>
          <p>{['A search for happiness.', 'Resistance.', 'Desire.', 'The arts.', 'And finally — a kiss.'][friezeIndex]}</p>
          <details className="context-note context-note--frieze">
            <summary><b>Why / Learn</b><span>Why this room matters</span></summary>
            <div><p>The exhibition honoured Ludwig van Beethoven on the seventy-fifth anniversary of his death. Around 1900 he was revered as the gifted artist who suffers yet creates something universal.</p>
            <p>Klimt turned the human search for happiness — inspired by Beethoven’s Ninth Symphony — into a procession across three walls. The final kiss answers the struggle that comes before it.</p>
            <p>The frieze was conceived for this exhibition, not as an isolated permanent mural. Its rhythm, scale and procession belonged to Hoffmann’s temporary architecture and to the encounter with Klinger’s sculpture.</p>
            <strong>What you learn</strong><span>The frieze changes meaning when it is experienced as a route through a specific room.</span></div>
          </details>
          <div className="frieze-controls" aria-label="Move through the frieze">
            <span>0{friezeIndex + 1} / 05 · {friezeSeen.length} marked</span>
            {friezePosition > .2 && <button type="button" onClick={() => setFriezePosition(Math.max(0, friezeIndex - 1))}>←</button>}
            {friezePosition < 3.8 && <button type="button" onClick={() => setFriezePosition(Math.min(4, friezeIndex + 1))}>→</button>}
          </div>
          {friezeComplete && <div className="frieze-reveal auto-complete"><i>✓</i><span>Frieze route cleared.</span><small>All five stages are marked. Returning to the workroom…</small></div>}
        </div>
        <button className="chapter-close chapter-close--light" type="button" onClick={() => setFocus(null)} aria-label="Return to the preparation room">×</button>
      </section>

      <section className={`chapter chapter--invitation ${focus === 'invitation' ? 'is-open' : ''} ${tereyPacked && beerPacked ? 'dispatch-prepared' : ''} ${dispatchSent ? 'dispatch-sent' : ''}`} aria-hidden={focus !== 'invitation'}>
        <img className="chapter__art" src={asset('correspondence-terey-v1.png')} alt="A hand-drawn reconstructed letter, invitation and addressed envelope" />
        <article className="invitation-copy">
          <span className="reconstruction">Reconstructed from archival correspondence</span>
          <p className="chapter-kicker">12 April 1902 · Budapest → Vienna</p>
          <h3>One invitation is still outstanding.</h3>
          <p>Gabriel von Térey writes from Budapest’s National Gallery. He knew Klinger’s <em>Beethoven</em> from the artist’s studio and planned to attend the opening.</p>
          <p>He asks for a second invitation for Joseph Beer, a restorer at the National Gallery.</p>
          <p>Both cards are to be delivered to Hotel Kaiserhof.</p>
          <div className="ending-cue"><b>Dispatch check</b><span>Bundle Térey’s card and Beer’s additional card. Both must go to Hotel Kaiserhof.</span></div>
          <div className="dispatch-workbench" aria-label="Place both invitation cards in the envelope">
            <div className="dispatch-cards">
              <button className={tereyPacked ? 'is-packed' : ''} type="button" disabled={tereyPacked} onClick={() => { soundCue('paper'); setTereyPacked(true); }}><small>Invitation</small><b>Gabriel von Térey</b><span>{tereyPacked ? 'Inside envelope ✓' : 'Place in envelope →'}</span></button>
              <button className={beerPacked ? 'is-packed' : ''} type="button" disabled={beerPacked} onClick={() => { soundCue('paper'); setBeerPacked(true); }}><small>Additional invitation</small><b>Joseph Beer</b><span>{beerPacked ? 'Inside envelope ✓' : 'Place in envelope →'}</span></button>
            </div>
            <div className={`dispatch-envelope ${tereyPacked ? 'has-terey' : ''} ${beerPacked ? 'has-beer' : ''}`} aria-hidden="true"><i /><i /><span>HOTEL<br />KAISERHOF</span></div>
          </div>
          {tereyPacked && beerPacked && !dispatchSent && <div className="dispatch-confirmation"><p><strong>Dispatch ready.</strong><span>Two invitation cards. One destination.</span></p><button className="chapter-link next-action" type="button" onClick={dispatchInvitations}><small>Both cards enclosed</small>Send to Hotel Kaiserhof →</button></div>}
        </article>
        {dispatchSent && <div className="dispatch-flight"><div className="flying-envelope" aria-hidden="true"><span>HOTEL KAISERHOF</span></div><p><small>Opening day · Vienna</small><strong>CORRESPONDENCE CLEARED. ✓</strong><span>Transport, price and invitations are recorded. Returning to the workroom…</span></p></div>}
      </section>

      <section className={`chapter chapter--walkthrough ${focus === 'walkthrough' ? 'is-open' : ''}`} aria-hidden={focus !== 'walkthrough'}>
        <img className="walkthrough-room" src={asset('secession-interior-v4.png')} alt="The exhibition room prepared for its final inspection" />
        <div className="walkthrough-light" aria-hidden="true" />
        <article className="walkthrough-copy">
          <span>Final walk-through</span><h3>One room.<br />Three systems.</h3>
          <p>Confirm the traces of your work directly in the completed room. Only then can the doors open.</p>
        </article>
        <div className="walkthrough-checks">
          <button className={walkthroughChecks.includes('correspondence') ? 'is-checked' : ''} onClick={() => toggleWalkthrough('correspondence')}><i /><b>Correspondence</b><span>{walkthroughChecks.includes('correspondence') ? 'Resolved ✓' : 'Confirm documents and dispatch'}</span></button>
          <button className={walkthroughChecks.includes('sightline') ? 'is-checked' : ''} onClick={() => toggleWalkthrough('sightline')}><i /><b>Sightline</b><span>{walkthroughChecks.includes('sightline') ? 'Confirmed ✓' : 'Confirm the view to Beethoven'}</span></button>
          <button className={walkthroughChecks.includes('frieze') ? 'is-checked' : ''} onClick={() => toggleWalkthrough('frieze')}><i /><b>Frieze route</b><span>{walkthroughChecks.includes('frieze') ? 'Complete ✓' : 'Confirm all five stages'}</span></button>
        </div>
        {walkthroughChecks.length === 3 && <button className="release-opening" type="button" onClick={() => { setDoorsOpen(false); setFocus('doors'); }}><small>Final inspection passed</small><b>Release the exhibition to the public</b><i>→</i></button>}
      </section>

      <section className={`chapter chapter--doors ${focus === 'doors' ? 'is-open' : ''} ${doorsOpen ? 'is-opening' : ''}`} aria-hidden={focus !== 'doors'}>
        <img className="doors-room" src={asset('secession-interior-v4.png')} alt="The prepared exhibition room" />
        <div className="door-leaf door-leaf--left" aria-hidden="true" />
        <div className="door-leaf door-leaf--right" aria-hidden="true" />
        <div className="doors-copy">
          <span>The room is calm. Movement gathers outside.</span>
          <h3>The doors are about to open.</h3>
          <button type="button" onClick={openDoors}>Open the doors</button>
        </div>
      </section>

      <section className={`chapter chapter--epilogue ${focus === 'epilogue' ? 'is-open' : ''}`} aria-hidden={focus !== 'epilogue'}>
        <div className="public-arrival" aria-hidden="true">
          <img src={asset('secession-interior-v4.png')} alt="" />
          <div className="public-shadows"><i /><i /><i /><i /><i /></div>
          <div className="public-fragments"><i /><i /><i /></div>
          <div className="public-graphite"><i /><i /><i /></div>
          <div className="arrival-stamps"><span>Correspondence cleared</span><span>Sightline confirmed</span><span>Frieze route complete</span></div>
        </div>
        <div className="visitors-number"><strong>58,000</strong><span>people visited the XIV Exhibition.</span><small>It became one of the Secession’s greatest public successes.</small></div>
        <div className="gold-afterline" aria-hidden="true" />
        <div className="memory-echo" aria-hidden="true"><img src={asset('secession-exterior-v10.png')} alt="" /><img src={asset('secession-interior-v4.png')} alt="" /><img src={asset('beethoven-frieze-v2.png')} alt="" /></div>
        <article className="afterlife-copy">
          <span className="completion-stamp">Final inspection passed · 3 / 3</span>
          <h3>The exhibition<br /><em>is ready.</em></h3>
          <p>The doors are open. The public can enter now. <em>Your final checks made the complete spatial experience visible.</em></p>
          <div className="today-note"><b>Vienna, today</b><span>You can still walk into that room.</span></div>
          <div className="takeaway inspection-record"><b>Final inspection record</b><span>01 · Correspondence cleared</span><span>02 · Sightline confirmed</span><span>03 · Frieze route complete</span><button type="button" onClick={downloadInspectionRecord}>Take the record with you ↓</button></div>
          <nav><a href="https://secession.at/beethovenfrieze" target="_blank" rel="noreferrer">Enter Vienna today →</a><details><summary>Sources / method</summary><p>This experience is based on archival material relating to the XIV Exhibition of the Vienna Secession in 1902. Historical events, dates and correspondence have been adapted for an interactive format. Reconstructed documents, visual environments and narrative transitions are original interpretations by Salon Format. Sound: “footsteps in museum” by Anya_Media and “Museum Gallery ambience soft walla calm steps” by visionear, both CC0 via Freesound.</p></details><button type="button" onClick={replay}>Experience again</button></nav>
        </article>
      </section>
    </main>
  );
}
