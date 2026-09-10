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
  const sightlineAligned = Math.abs(roomView - 53) <= 6;
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
  const audioReverb = useRef<ConvolverNode | null>(null);
  const climaxPlayed = useRef(false);
  const publicAmbience = useRef<HTMLAudioElement | null>(null);
  const workroomAmbience = useRef<HTMLAudioElement | null>(null);
  const invitationDrag = useRef<{ x:number; y:number; card:'terey' | 'beer' } | null>(null);
  const recordStep = () => window.history.pushState({ museumExperience:true }, '', window.location.href);
  const friezeIndex = Math.min(4, Math.max(0, Math.round(friezePosition)));
  const friezeStages = ['The search', 'Resistance', 'Desire', 'The arts', 'The kiss'];
  // Screen-space positions calibrated to the motif currently revealed by the moving 175vw artwork.
  const friezeMarkers = [{x:25,y:45},{x:48,y:43},{x:69,y:48},{x:77,y:46},{x:86,y:43}];
  const friezeComplete = friezeSeen.length === 5;
  const completedCount = Number(letterComplete) + Number(roomComplete) + Number(friezeComplete);
  const inspectionComplete = completedCount === 3;
  const systemLabel = focus === 'letter' ? 'correspondence' : focus === 'rooms' ? 'the rooms' : focus === 'frieze' ? 'the frieze' : focus === 'invitation' ? 'invitation' : focus === 'walkthrough' ? 'final walk-through' : focus === 'doors' ? 'opening' : focus === 'epilogue' ? 'afterlife' : stage === 'threshold' ? 'briefing' : 'workroom';
  const systemNumber = focus === 'letter' ? '01' : focus === 'rooms' ? '02' : focus === 'frieze' ? '03' : focus === 'invitation' ? '04' : focus === 'doors' || focus === 'epilogue' ? '05' : '00';
  const guidance = (() => {
    if (focus === 'letter') {
      const found = Number(letterHeadFound) + Number(letterPriceFound);
      return { step:`01 · Letter from Dresden · ${found}/2 found`, instruction:found === 0 ? 'Move across the document. Hold over the passages about the marble head and Beethoven’s price.' : found === 1 ? 'One matter is noted. Keep searching the document for the second responsive passage.' : 'Both matters are noted. They are now being passed to the exhibition office.' };
    }
    if (focus === 'invitation') return { step:'01 · Correspondence', instruction:tereyPacked && beerPacked ? 'Both cards are enclosed; the envelope is being dispatched to Hotel Kaiserhof.' : 'Place both cards in the envelope — guest access was part of the exhibition’s practical work.' };
    if (focus === 'rooms') return { step:'02 · Sightline', instruction:sightlineAligned ? 'Hold this view: architecture, sculpture and painting now connect as Hoffmann intended.' : 'Drag the beam onto the statue until the three art forms become one view.' };
    if (focus === 'frieze') return { step:`03 · Visitor route · ${friezeSeen.length}/5 found`, instruction:friezeSeen.includes(friezeIndex) ? 'Route point confirmed. The wall is moving to the next stage.' : 'Find the glowing marker on the pictured motif and select it. Confirm all five stages in order—from search to kiss.' };
    if (focus === 'walkthrough') return { step:'Final walk-through', instruction:walkthroughChecks.length === 3 ? 'Logistics, space and narrative now work together; the exhibition can be released.' : 'Watch the completed room register the three systems you have already checked.' };
    if (focus === 'doors') return { step:'Opening', instruction:'Open the doors: your private inspection now becomes a public cultural experience.' };
    return { step:'Final inspection', instruction:'Choose any glowing work point and discover how letters, architecture and art made one exhibition possible.' };
  })();

  const ensureSound = () => {
    if (audioContext.current) return audioContext.current;
    const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = new AudioCtor();
    const master = context.createGain();
    const compressor = context.createDynamicsCompressor();
    const reverb = context.createConvolver();
    const impulse = context.createBuffer(2, context.sampleRate * 1.8, context.sampleRate);
    for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let sample = 0; sample < data.length; sample += 1) data[sample] = (Math.random() * 2 - 1) * Math.pow(1 - sample / data.length, 2.7);
    }
    reverb.buffer = impulse;
    master.gain.value = soundEnabled ? .16 : 0;
    compressor.threshold.value = -22;
    compressor.ratio.value = 4;
    master.connect(compressor).connect(context.destination);
    reverb.connect(master);
    audioContext.current = context;
    audioMaster.current = master;
    audioReverb.current = reverb;
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
    const panner = context.createStereoPanner();
    const wet = context.createGain();
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
    panner.pan.value = { threshold:-.45, room:-.2, paper:.38, passage:.15, frieze:.55, climax:0, doors:0 }[kind];
    wet.gain.value = kind === 'paper' ? .08 : .24;
    oscillator.connect(filter).connect(gain).connect(panner).connect(master);
    if (audioReverb.current) panner.connect(wet).connect(audioReverb.current);
    oscillator.start(now); oscillator.stop(now + settings[2] + .05);

    if (kind === 'paper' || kind === 'room' || kind === 'doors') {
      const duration = kind === 'paper' ? .22 : .48;
      const buffer = context.createBuffer(1, Math.floor(context.sampleRate * duration), context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < data.length; index += 1) data[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / data.length, kind === 'paper' ? 1.4 : 3.2);
      const texture = context.createBufferSource();
      const textureFilter = context.createBiquadFilter();
      const textureGain = context.createGain();
      const texturePan = context.createStereoPanner();
      texture.buffer = buffer;
      textureFilter.type = kind === 'paper' ? 'highpass' : 'bandpass';
      textureFilter.frequency.value = kind === 'paper' ? 1100 : 180;
      textureGain.gain.value = kind === 'paper' ? .08 : .12;
      texturePan.pan.value = kind === 'paper' ? .42 : -.28;
      texture.connect(textureFilter).connect(textureGain).connect(texturePan).connect(master);
      texture.start(now + .02);
    }
  };

  const enterThreshold = () => { recordStep(); soundCue('threshold'); setStage('threshold'); };
  const beginRoom = () => {
    recordStep();
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
    event.preventDefault();
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

  const dragInvitation = (event:React.PointerEvent<HTMLButtonElement>, card:'terey' | 'beer') => {
    event.currentTarget.setPointerCapture(event.pointerId);
    invitationDrag.current = { x:event.clientX, y:event.clientY, card };
  };

  const moveInvitation = (event:React.PointerEvent<HTMLButtonElement>) => {
    const drag = invitationDrag.current;
    if (!drag || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    event.currentTarget.style.setProperty('--card-x', `${event.clientX - drag.x}px`);
    event.currentTarget.style.setProperty('--card-y', `${event.clientY - drag.y}px`);
  };

  const dropInvitation = (event:React.PointerEvent<HTMLButtonElement>) => {
    const drag = invitationDrag.current;
    if (!drag) return;
    const envelope = event.currentTarget.closest('.dispatch-workbench')?.querySelector('.dispatch-envelope');
    const rect = envelope?.getBoundingClientRect();
    const inside = Boolean(rect && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom);
    event.currentTarget.style.setProperty('--card-x','0px');
    event.currentTarget.style.setProperty('--card-y','0px');
    invitationDrag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!inside) return;
    soundCue('paper');
    if (drag.card === 'terey') setTereyPacked(true); else setBeerPacked(true);
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

  useEffect(() => {
    window.history.replaceState({ museumExperience:true }, '', window.location.href);
  }, []);

  useEffect(() => {
    const handleBrowserBack = () => goBack();
    window.addEventListener('popstate', handleBrowserBack);
    return () => window.removeEventListener('popstate', handleBrowserBack);
  }, [focus, stage, introSkipped]);

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
    window.setTimeout(() => setFocus('epilogue'), 2600);
  };

  const downloadInspectionRecord = () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600"><rect width="1200" height="1600" fill="#F1EBDD"/><path d="M0 0H1200V530L1060 490 1110 760 1000 940 1050 1600H0Z" fill="#2520E8"/><circle cx="965" cy="245" r="164" fill="#A98235"/><g fill="#F1EBDD" stroke="#201D1A" stroke-width="7"><path d="M760 190h410v430H760z"/><path d="M815 112h300v165H815z"/><path d="M862 42h206v147H862z"/><path d="M900 300h130v320H900z"/></g><path d="M900 300h130v320H900z" fill="#201D1A"/><text x="70" y="92" fill="#201D1A" font-family="Arial,sans-serif" font-size="22" font-weight="700" letter-spacing="7">SALON FORMAT · VIENNA · 15 APRIL 1902</text><text x="70" y="235" fill="#201D1A" font-family="Georgia,serif" font-size="94">BEFORE THE</text><text x="70" y="330" fill="#201D1A" font-family="Georgia,serif" font-size="94">DOORS OPEN</text><text x="70" y="430" fill="#6B2F2B" font-family="Arial,sans-serif" font-size="27" font-weight="700" letter-spacing="5">OPENING-DAY KEEPSAKE</text><g transform="translate(70 650) rotate(-1)"><rect width="940" height="118" fill="#F1EBDD" stroke="#201D1A" stroke-width="4"/><text x="40" y="72" fill="#201D1A" font-family="Arial,sans-serif" font-size="27" font-weight="700" letter-spacing="3">01 · CORRESPONDENCE CLEARED  ✓</text></g><g transform="translate(120 795) rotate(1)"><rect width="940" height="118" fill="#47716D" stroke="#201D1A" stroke-width="4"/><text x="40" y="72" fill="#F1EBDD" font-family="Arial,sans-serif" font-size="27" font-weight="700" letter-spacing="3">02 · SIGHTLINE CONFIRMED  ✓</text></g><g transform="translate(72 940) rotate(-.6)"><rect width="940" height="118" fill="#A98235" stroke="#201D1A" stroke-width="4"/><text x="40" y="72" fill="#201D1A" font-family="Arial,sans-serif" font-size="27" font-weight="700" letter-spacing="3">03 · FRIEZE ROUTE COMPLETE  ✓</text></g><text x="70" y="1215" fill="#F1EBDD" font-family="Georgia,serif" font-size="76">You made the</text><text x="70" y="1295" fill="#F1EBDD" font-family="Georgia,serif" font-size="76">opening possible.</text><text x="70" y="1390" fill="#E4BD4F" font-family="Arial,sans-serif" font-size="24" font-weight="700" letter-spacing="5">58,000 PEOPLE VISITED THE XIV EXHIBITION.</text><text x="70" y="1460" fill="#F1EBDD" font-family="Arial,sans-serif" font-size="21">Letters, architecture and art were experienced as one spatial composition.</text><text x="70" y="1530" fill="#F1EBDD" font-family="Arial,sans-serif" font-size="18" letter-spacing="4">YOUR FINAL INSPECTION · SALONFORMAT.COM</text></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type:'image/svg+xml' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'before-the-doors-open-opening-day-keepsake.svg';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
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
    if (focus !== 'rooms' || !sightlineAligned) return;
    if (!roomComplete) { setRoomComplete(true); soundCue('room'); }
    const done = window.setTimeout(() => setFocus(null), 2200);
    return () => window.clearTimeout(done);
  }, [focus, sightlineAligned, roomComplete]);

  useEffect(() => {
    if (focus !== 'letter' || !letterHeadFound || !letterPriceFound) return;
    soundCue('paper');
    const advance = window.setTimeout(() => setFocus('invitation'), 2600);
    return () => window.clearTimeout(advance);
  }, [focus, letterHeadFound, letterPriceFound]);

  useEffect(() => {
    if (focus !== 'invitation' || !tereyPacked || !beerPacked || dispatchSent) return;
    const send = window.setTimeout(dispatchInvitations, 900);
    return () => window.clearTimeout(send);
  }, [focus, tereyPacked, beerPacked, dispatchSent]);

  useEffect(() => {
    if (focus !== 'invitation' || !dispatchSent) return;
    const returnToRoom = window.setTimeout(() => {
      setLetterComplete(true);
      setFocus(null);
    }, 3000);
    return () => window.clearTimeout(returnToRoom);
  }, [focus, dispatchSent]);

  useEffect(() => {
    if (focus !== 'walkthrough') return;
    const items = ['correspondence','sightline','frieze'];
    const timers = items.map((item,index) => window.setTimeout(() => {
      setWalkthroughChecks((checks) => checks.includes(item) ? checks : [...checks,item]);
      soundCue('room');
    }, 550 + index * 520));
    return () => timers.forEach(window.clearTimeout);
  }, [focus]);

  useEffect(() => {
    if (focus !== 'frieze' || !friezeSeen.includes(friezeIndex) || friezeIndex >= 4) return;
    const advance = window.setTimeout(() => setFriezePosition(friezeIndex + 1), 720);
    return () => window.clearTimeout(advance);
  }, [focus, friezeIndex, friezeSeen]);

  useEffect(() => {
    if (focus !== 'frieze' || !friezeComplete) return;
    const done = window.setTimeout(() => setFocus(null), 1450);
    return () => window.clearTimeout(done);
  }, [focus, friezeComplete]);

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
      <audio ref={workroomAmbience} src={`${import.meta.env.BASE_URL}audio/museum-gallery-ambience-cc0.mp3`} loop preload="auto" />
      <div className="cursor-mark" aria-hidden="true" />
      <nav className="global-navigation" aria-label="Experience navigation">
        {(introSkipped || stage !== 'outside' || focus) && <button type="button" onClick={goBack}><i>←</i><span>Back</span></button>}
        <a href="https://salonformat.com" target="_blank" rel="noreferrer">Salon Format</a>
      </nav>
      <button className="sound-toggle" type="button" onClick={() => setSoundEnabled((enabled) => !enabled)} aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}><i aria-hidden="true" />{soundEnabled ? 'Sound on' : 'Sound off'}</button>
      <aside className="work-ledger" aria-live="polite"><i /><span>Opening day · final inspection</span><b>{systemLabel}</b><small>{completedCount} / 3 ready</small></aside>
      {stage === 'inside' && focus !== 'epilogue' && <aside className={`action-compass action-compass--${focus ?? 'workroom'}`} aria-live="polite"><span>{guidance.step}</span><p>{guidance.instruction}</p></aside>}
      <div className={`opening-slate ${introSkipped ? 'is-skipped' : ''}`}>
        <span className="opening-identity"><b>The XIV Exhibition</b><em>Vienna Secession · 1902</em></span>
        <div className="opening-glimpse"><img src={asset('secession-exterior-v10.png')} alt="" /><i /><i /></div>
        <h1 className="prologue-title"><span>Before</span><em>the doors</em><strong>open.</strong></h1>
        <p><strong>Enter the Vienna Secession before the public—</strong>and help prepare its landmark XIV Exhibition, created around Max Klinger’s monumental Beethoven.</p>
        <div className="opening-slate__modes"><i>Letters</i><i>Architecture</i><i>Klimt’s Beethoven Frieze</i></div>
        <button className="skip-prologue" type="button" onClick={() => { recordStep(); setIntroSkipped(true); }}><small>Vienna · 15 April 1902</small><b>Begin</b><i>→</i></button>
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
          <h1><span>Ah, there</span><em>You are.</em></h1>
          <div className="opening-role">
            <p className="opening-role__edition">The XIV Exhibition opens today.</p>
            <p className="opening-role__task"><b>Your role</b><span>You are part of the exhibition team. Complete the three final checks before the public enters.</span></p>
            <p className="opening-role__purpose">Discover how practical preparations, Hoffmann’s spatial design and Klimt’s frieze came together around Klinger’s Beethoven.</p>
          </div>
        </div>
        <button className="threshold" type="button" aria-label="Open the entrance door of the Vienna Secession" onClick={enterThreshold} disabled={stage !== 'outside'}>
          <span className="threshold__portal" aria-hidden="true"><i /><i /><i /></span><span className="threshold__label">Open the door</span>
        </button>
      </section>

      <section className="passage" aria-label="Your role before entering" aria-hidden={stage !== 'threshold'}>
        <span /><span /><span />
        <article className="passage-brief">
          <p>Final inspection / XIV Exhibition</p>
          <h2><small>Before the public arrives</small>Three things still need your attention.</h2>
          <p className="passage-brief__lead">Inspect two letters, test Hoffmann’s sightline and follow Klimt’s frieze before the doors open.</p>
          <div className="passage-brief__grid">
            <div><strong>01</strong><b>Correspondence</b><span>Find two unresolved matters in art dealer Ernst Arnold’s letter. Then send the invitation requested by Gabriel von Térey, director of Budapest’s National Gallery.</span></div>
            <div><strong>02</strong><b>The sightline</b><span>Architect Josef Hoffmann used a wall opening to connect Klimt’s frieze room with Klinger’s Beethoven statue. Find that intended view.</span></div>
            <div><strong>03</strong><b>The frieze route</b><span>Find and confirm five narrative stages in order—from the search for happiness to the final kiss. This checks that visitors can follow Klimt’s complete story through the room.</span></div>
          </div>
          <footer><span>When all three connect, the doors can open.</span><button className="workroom-entry" type="button" onClick={beginRoom}><small>Start the final inspection</small><b>Enter the workroom</b><i>→</i></button></footer>
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
        </div>
        <nav className="attention" aria-label="Areas in the room">
          <p className="attention__prompt"><b>{inspectionComplete ? 'The room is ready for its final walk-through.' : `${3 - completedCount} preparation${3 - completedCount === 1 ? '' : 's'} unresolved.`}</b><span>{inspectionComplete ? 'Inspect the completed room once more, then release it to the public.' : 'Move your pointer through the drawing. Choose any glowing work point; every completed check changes this room.'}</span></p>
          <button className="attention__item attention__item--letters" type="button" onClick={() => { recordStep(); setFocus('letter'); }}>
            <i /><span><b>Two letters {letterComplete && '✓'}</b><small>Check Klinger’s shipment, then answer Térey</small></span>
          </button>
          <button className="attention__item attention__item--rooms" type="button" onClick={() => { recordStep(); soundCue('room'); setModelRevealed(true); setFocus('rooms'); }}>
            <i /><span><b>The sightline {roomComplete && '✓'}</b><small>Test the view through the wall opening</small></span>
          </button>
          <button className={`attention__item attention__item--frieze ${friezeComplete ? 'is-cleared' : ''}`} type="button" onClick={() => { recordStep(); setFocus('frieze'); }}>
            <i /><span><b>The frieze route {friezeComplete && '✓'}</b><small>Find five story stages in order</small></span>
          </button>
          {inspectionComplete && <button className="final-walkthrough-entry" type="button" onClick={() => { recordStep(); setFocus('walkthrough'); }}><small>3 / 3 preparations ready</small><b>Walk through the finished exhibition</b><i>→</i></button>}
        </nav>
      </section>

      <section className={`chapter chapter--letter ${focus === 'letter' ? 'is-open' : ''}`} aria-hidden={focus !== 'letter'}>
        <img className="chapter__art" src={asset('correspondence-arnold-v1.png')} alt="A hand-drawn reconstructed letter with two telegram slips" />
        <div className="document-hotspots" aria-label="Inspect the archival reconstruction">
          <button className={letterHeadFound ? 'is-found' : ''} type="button" onClick={() => { soundCue('paper'); setLetterHeadFound(true); }}><span>01 · Arrival</span><b>{letterHeadFound ? 'Noted ✓' : 'Tap to report'}</b></button>
          <button className={letterPriceFound ? 'is-found' : ''} type="button" onClick={() => { soundCue('paper'); setLetterPriceFound(true); }}><span>02 · Price</span><b>{letterPriceFound ? 'Noted ✓' : 'Tap to report'}</b></button>
        </div>
        <div className="chapter__veil" />
        <article className="document-copy">
          <span className="reconstruction">Reconstructed from archival correspondence</span>
          <p className="chapter-kicker">10 April 1902 · Dresden → Vienna</p>
          <h3>Has the marble head arrived?</h3>
          <p className="letter-context"><b>Who is writing?</b> Dresden art dealer Ernst Arnold writes to the Secession about German artist Max Klinger’s shipment. Klinger’s monumental <em>Beethoven</em> is the centrepiece of the exhibition.</p>
          <p className="worker-cue"><b>What to do</b><span>Report the two unresolved matters: select 01 for the marble head’s arrival and 02 for the unanswered price request.</span></p>
          <p>Max Klinger meant to send the marble head with his monumental Beethoven sculpture, but its dispatch was delayed. The letter does not confirm whether it arrived in time.</p>
          <p>Two telegrams have already been sent.</p>
          <p>And one more question: what sale price is being asked for Klinger’s Beethoven sculpture?</p>
          <details className="context-note">
            <summary><b>Context</b><span>About this letter</span></summary>
            <div><p>The exhibition was also a practical undertaking. Works had to travel, correspondence had to arrive, invitations had to be sent and prices had to be decided.</p>
            <p>This is not a fictional emergency. The uncertainty documented in Ernst Arnold’s letter is enough: five days before opening, transport and money were still part of the work.</p>
            <p>In the correspondence, “Beethoven” is shorthand for Max Klinger’s monumental sculpture of the composer — a polychrome work in bronze and marble, and the physical centre of the exhibition.</p>
            <strong>What you learn</strong><span>An exhibition is made through logistics, money and human decisions as well as art.</span></div>
          </details>
          {letterHeadFound && letterPriceFound ? <div className="auto-complete auto-complete--letter"><i>✓</i><b>Passed to the exhibition office</b><span>Marble head — arrival unconfirmed<br />Beethoven — price reply outstanding</span></div> : <p className="check-progress">Select the visible markers 01 and 02. Both reports will then be passed to the exhibition office.</p>}
        </article>
        <button className="chapter-close" type="button" onClick={() => setFocus(null)} aria-label="Return to the preparation room">×</button>
      </section>

      <section className={`chapter chapter--rooms ${focus === 'rooms' ? 'is-open' : ''} ${modelRevealed ? 'model-revealed' : ''} ${roomEntering ? 'is-entering' : ''}`} aria-hidden={focus !== 'rooms'} style={{'--room-view': roomView} as React.CSSProperties}>
        <div className="room-image-action" onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); moveViewpoint(event); }} onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId) || event.buttons === 1) moveViewpoint(event); }} onPointerUp={(event) => { moveViewpoint(event); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }} onPointerCancel={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}>
          <img className="chapter__art room-model-art" src={asset('spatial-model-v1.png')} alt="An abstract hand-drawn model showing the left side hall opening toward Klinger’s Beethoven" />
          {modelRevealed && <div className={`sightline-viewfinder ${sightlineAligned ? 'is-aligned' : ''}`} style={{'--view-x':`${roomView}%`} as React.CSSProperties} aria-hidden="true"><i /><span /></div>}
          {modelRevealed && <button className={`room-opening-hotspot ${sightlineAligned ? 'is-aligned' : ''}`} type="button" onClick={() => setRoomView(53)}><i aria-hidden="true" /><b>{sightlineAligned ? 'Sightline confirmed' : 'Bring the light here'}</b><span>{sightlineAligned ? 'Architecture, sculpture and painting connect' : 'Drag onto or tap the statue'}</span></button>}
        </div>
        <article className="rooms-copy">
          <p className="chapter-kicker">The rooms</p>
          <p className="worker-cue"><b>Your task</b><span>Drag directly across the drawn room to change your position. Stop when Klinger’s statue sits clearly inside the wall opening.</span></p>
          <h3>Make the room make sense.</h3>
          <p>Painting. Sculpture. Architecture.</p>
          <p>Designed to be experienced together.</p>
          <details className="context-note">
            <summary><b>Context</b><span>About Hoffmann’s design</span></summary>
            <div><p>Under Josef Hoffmann’s direction, twenty-one artists shaped one exhibition. Klinger’s statue stood in the main hall, Klimt’s frieze in the left side hall, and a wall opening connected both views.</p>
            <strong>What you learn</strong><span>Gesamtkunstwerk here is spatial: painting, sculpture and architecture shape one experience.</span></div>
          </details>
        </article>
        <div className="room-control">
          <div className="view-step"><b>{sightlineAligned ? 'Sightline confirmed' : 'Move the light to Beethoven'}</b><span>{sightlineAligned ? 'Painting, sculpture and architecture now connect in one view.' : 'Drag directly across the drawing—or tap the statue—to complete the sightline.'}</span></div>
          {sightlineAligned ? <div className="auto-complete"><i>✓</i><b>Sightline confirmed</b><span>Returning to the workroom…</span></div> : <span className="room-control__hint">Drag the light onto the statue.</span>}
        </div>
        <button className="chapter-close" type="button" onClick={() => setFocus(null)} aria-label="Return to the preparation room">×</button>
      </section>

      <section className={`chapter chapter--frieze ${focus === 'frieze' ? 'is-open' : ''} ${friezeComplete ? 'frieze-climax' : ''}`} aria-hidden={focus !== 'frieze'} style={{'--frieze': friezePosition} as React.CSSProperties}>
        <div className="frieze-threshold" aria-hidden="true"><span>Painting.</span><span>Sculpture.</span><span>Architecture.</span></div>
        <div className="frieze-pan"
          onPointerDown={(event) => { if ((event.target as HTMLElement).closest('.frieze-object-marker')) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.classList.add('is-dragging'); friezeDrag.current = { x: event.clientX, position: friezePosition }; }}
          onPointerMove={(event) => { const drag = friezeDrag.current; if (!drag) return; event.preventDefault(); setFriezePosition(Math.min(4, Math.max(0, drag.position + (drag.x - event.clientX) / window.innerWidth * 5))); }}
          onPointerUp={(event) => { if (!friezeDrag.current) return; friezeDrag.current = null; event.currentTarget.classList.remove('is-dragging'); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
          onPointerCancel={(event) => { friezeDrag.current = null; event.currentTarget.classList.remove('is-dragging'); }}
          onWheel={(event) => { event.preventDefault(); const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY; setFriezePosition((position) => Math.min(4, Math.max(0, position + delta / 360))); }}>
          <img className="chapter__art" src={asset('beethoven-frieze-v2.png')} alt="A visibly hand-drawn abstract interpretation of the Beethoven Frieze, from human longing through hostile forces to the golden conclusion" draggable="false" onDragStart={(event) => event.preventDefault()} />
          <button className={`frieze-object-marker ${friezeSeen.includes(friezeIndex) ? 'is-marked' : ''}`} style={{'--marker-x':`${friezeMarkers[friezeIndex].x}%`,'--marker-y':`${friezeMarkers[friezeIndex].y}%`} as React.CSSProperties} type="button" disabled={friezeSeen.includes(friezeIndex)} onPointerDown={(event) => event.stopPropagation()} onPointerUp={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); markFriezeStage(); }} aria-label={`${friezeSeen.includes(friezeIndex) ? 'Confirmed' : 'Confirm'} ${friezeStages[friezeIndex]}`}><i /><span>{friezeStages[friezeIndex]}</span><b>{friezeSeen.includes(friezeIndex) ? 'Complete ✓' : 'Select to confirm'}</b></button>
          {friezeComplete && <div className="kiss-focus" aria-hidden="true"><i /><b>The kiss</b></div>}
        </div>
        <div className="frieze-copy">
          <p className="worker-cue worker-cue--frieze"><b>{friezeSeen.includes(friezeIndex) ? `Route point ${friezeIndex + 1} confirmed ✓` : `Find the marked motif · ${friezeIndex + 1} of 5`}</b><span>{friezeSeen.includes(friezeIndex) ? (friezeIndex < 4 ? 'Confirmed. Moving automatically to the next part of the story…' : 'The complete route—from search to kiss—is ready for visitors.') : `Locate the glowing marker on “${friezeStages[friezeIndex]}” and select it. This confirms the next step in the visitor’s route.`}</span></p>
          <p>{['A search for happiness.', 'Resistance.', 'Desire.', 'The arts.', 'And finally — a kiss.'][friezeIndex]}</p>
          <details className="context-note context-note--frieze">
            <summary><b>Context</b><span>About the Beethoven Frieze</span></summary>
            <div><p>The exhibition honoured Ludwig van Beethoven on the seventy-fifth anniversary of his death. Around 1900 he was revered as the gifted artist who suffers yet creates something universal.</p>
            <p>Klimt turned the human search for happiness — inspired by Beethoven’s Ninth Symphony — into a procession across three walls. The final kiss answers the struggle that comes before it.</p>
            <p>The frieze was conceived for this exhibition, not as an isolated permanent mural. Its rhythm, scale and procession belonged to Hoffmann’s temporary architecture and to the encounter with Klinger’s sculpture.</p>
            <strong>What you learn</strong><span>The frieze changes meaning when it is experienced as a route through a specific room.</span></div>
          </details>
          <div className="frieze-controls" aria-label="Move through the frieze">
            <span>0{friezeIndex + 1} / 05 · {friezeSeen.length} confirmed</span>
            {friezePosition > .2 && <button type="button" onClick={() => setFriezePosition(Math.max(0, friezeIndex - 1))}>←</button>}
            {friezePosition < 3.8 && <button type="button" onClick={() => setFriezePosition(Math.min(4, friezeIndex + 1))}>→</button>}
          </div>
          {friezeComplete && <div className="frieze-reveal auto-complete"><i>✓</i><span>The complete journey is visible.</span><small>All five stages are confirmed. Returning to the workroom…</small></div>}
        </div>
        <button className="chapter-close chapter-close--light" type="button" onClick={() => setFocus(null)} aria-label="Return to the preparation room">×</button>
      </section>

      <section className={`chapter chapter--invitation ${focus === 'invitation' ? 'is-open' : ''} ${tereyPacked && beerPacked ? 'dispatch-prepared' : ''} ${dispatchSent ? 'dispatch-sent' : ''}`} aria-hidden={focus !== 'invitation'}>
        <img className="chapter__art" src={asset('correspondence-terey-v1.png')} alt="A hand-drawn reconstructed letter, invitation and addressed envelope" />
        <article className="invitation-copy">
          <span className="reconstruction">Reconstructed from archival correspondence</span>
          <p className="chapter-kicker">12 April 1902 · Budapest → Vienna</p>
          <h3>Térey asks for a second invitation.</h3>
          <p>Gabriel von Térey of Budapest’s National Gallery plans to attend the opening. He requests an additional card for the restorer Joseph Beer.</p>
          <p className="invitation-action"><b>What to do</b> Place both cards in the envelope for Hotel Kaiserhof in Vienna.</p>
          <div className="ending-cue"><b>Dispatch check</b><span>Bundle Térey’s card and Beer’s additional card. Both must go to Hotel Kaiserhof.</span></div>
          <div className="dispatch-workbench" aria-label="Place both invitation cards in the envelope">
            <div className="dispatch-cards">
              <button className={tereyPacked ? 'is-packed' : ''} type="button" disabled={tereyPacked} onPointerDown={(event) => dragInvitation(event,'terey')} onPointerMove={moveInvitation} onPointerUp={dropInvitation} onPointerCancel={dropInvitation} onClick={() => { if (!tereyPacked) { soundCue('paper'); setTereyPacked(true); } }}><small>Invitation</small><b>Gabriel von Térey</b><span>{tereyPacked ? 'Inside envelope ✓' : 'Drag or tap into envelope'}</span></button>
              <button className={beerPacked ? 'is-packed' : ''} type="button" disabled={beerPacked} onPointerDown={(event) => dragInvitation(event,'beer')} onPointerMove={moveInvitation} onPointerUp={dropInvitation} onPointerCancel={dropInvitation} onClick={() => { if (!beerPacked) { soundCue('paper'); setBeerPacked(true); } }}><small>Additional invitation</small><b>Joseph Beer</b><span>{beerPacked ? 'Inside envelope ✓' : 'Drag or tap into envelope'}</span></button>
            </div>
            <div className={`dispatch-envelope ${tereyPacked ? 'has-terey' : ''} ${beerPacked ? 'has-beer' : ''}`} aria-hidden="true"><i /><i /><span>DROP BOTH HERE<br />HOTEL KAISERHOF</span></div>
          </div>
          {tereyPacked && beerPacked && !dispatchSent && <div className="dispatch-confirmation"><p><strong>Dispatch ready.</strong><span>The envelope is sealing automatically…</span></p></div>}
        </article>
        {dispatchSent && <div className="dispatch-flight"><div className="flying-envelope" aria-hidden="true"><span>HOTEL KAISERHOF</span></div><p><small>Opening day · Vienna</small><strong>CORRESPONDENCE CLEARED. ✓</strong><span>Transport and price are marked; the invitations are on their way. Returning to the workroom…</span></p></div>}
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
        {walkthroughChecks.length === 3 && <button className="release-opening" type="button" onClick={() => { recordStep(); setDoorsOpen(false); setFocus('doors'); }}><small>Final inspection passed</small><b>Release the exhibition to the public</b><i>→</i></button>}
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
          <svg className="ink-crowd" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMax meet">
            <g className="ink-person ink-person--one"><path d="M92 648c7-89 17-175 31-258 5-31 17-68 43-76 27-8 47 28 52 62 13 89 17 181 22 272M131 313c-4-31 8-58 30-61 23-3 42 21 42 53 0 31-16 56-39 57-22 1-39-20-33-49M111 404c-28 47-50 100-63 158m158-153c31 41 58 87 76 137"/><path d="M281 651c2-78 8-153 19-227 6-43 14-91 45-104 34-14 62 31 68 77 11 82 12 168 10 254M320 314c-3-35 13-63 39-63 25 1 42 29 38 64-4 34-24 58-49 54-24-4-36-25-28-55"/></g>
            <g className="ink-person ink-person--two"><path d="M486 650c9-106 17-206 37-300 7-34 21-71 49-76 31-5 53 35 55 75 5 99 5 199 10 301M531 271c-2-37 16-65 43-63 28 2 45 34 38 69-6 35-29 57-54 50-23-7-34-27-27-56M510 378c-35 50-62 107-80 168m181-160c38 42 70 94 94 151"/><path d="M701 651c4-81 11-160 24-236 7-42 18-86 48-96 31-11 56 27 61 71 10 87 12 174 13 261M742 313c0-32 15-57 38-56 24 1 39 28 34 60-5 31-24 51-46 45-21-5-31-24-26-49"/></g>
            <g className="ink-person ink-person--three"><path d="M892 650c4-92 12-181 27-265 7-39 20-81 51-89 33-8 57 34 61 78 8 91 7 184 10 276M934 291c-1-35 16-62 42-60 26 2 42 31 36 65-6 34-27 55-51 49-23-6-34-26-27-54M916 405c-34 43-61 94-80 150m180-151c34 39 63 85 84 137"/><path d="M1081 651c6-72 11-141 21-208 6-40 17-80 44-89 28-9 50 26 54 67 8 76 7 153 6 230M1117 349c-1-30 13-54 35-54s36 25 32 55c-4 30-21 49-42 45-20-5-29-23-25-46"/></g>
          </svg>
          <div className="public-shadows"><i /><i /><i /><i /><i /></div>
          <div className="public-type"><span>The public</span><b>enters.</b></div>
          <div className="public-graphite"><i /><i /><i /></div>
          <div className="arrival-stamps"><span>Correspondence cleared</span><span>Sightline confirmed</span><span>Frieze route complete</span></div>
        </div>
        <div className="visitors-number"><strong>58,000</strong><span>people visited the XIV Exhibition.</span><small>It became one of the Secession’s greatest public successes.</small></div>
        <div className="membership-afterword">
          <span>1902</span>
          <h3><b>The doors<br />were open.</b><em>But not<br />to everyone.</em></h3>
          <p>Women artists appeared in early Secession exhibitions. Yet women were not admitted as members of the association until <strong>1949.</strong></p>
          <i aria-hidden="true">1902 <b>→</b> 1949</i>
        </div>
        <div className="gold-afterline" aria-hidden="true" />
        <div className="memory-echo" aria-hidden="true"><img src={asset('secession-exterior-v10.png')} alt="" /><img src={asset('secession-interior-v4.png')} alt="" /><img src={asset('beethoven-frieze-v2.png')} alt="" /></div>
        <div className="finale-portal" aria-hidden="true"><img src={asset('secession-exterior-v10.png')} alt="" /><i /><i /><i /></div>
        <article className="afterlife-copy">
          <span className="completion-stamp">Vienna · 15 April 1902 · 3 / 3 complete</span>
          <h3><span>Your final inspection is complete</span><em>You made the opening possible.</em></h3>
          <p>You resolved the correspondence, confirmed Hoffmann’s sightline and checked Klimt’s five-part frieze route. The XIV Exhibition can now receive its public.</p>
          <div className="today-note"><b>Result</b><span>The exhibition is ready.</span></div>
          <div className="takeaway inspection-record"><b>Your opening-day keepsake</b><span>01 · Correspondence cleared</span><span>02 · Sightline confirmed</span><span>03 · Frieze route complete</span><button type="button" onClick={downloadInspectionRecord}>Download the poster ↓</button></div>
          <nav><a href="https://secession.at/beethovenfrieze" target="_blank" rel="noreferrer">Visit Klimt’s Beethoven Frieze today →</a><button type="button" onClick={replay}>Restart the experience</button><details><summary>Sources & credits</summary><p>Historical sources: <a href="https://secession.at/digital_archive_exhibition/56" target="_blank" rel="noreferrer">XIV Exhibition</a>, <a href="https://secession.at/digital_archive/406" target="_blank" rel="noreferrer">Ernst Arnold letter</a>, <a href="https://secession.at/digital_archive/1526" target="_blank" rel="noreferrer">Gabriel von Térey letter</a>, <a href="https://secession.at/beethovenfrieze" target="_blank" rel="noreferrer">Beethoven Frieze</a> and <a href="https://secession.at/association_of_visual_artists_vienna_secession" target="_blank" rel="noreferrer">Association history</a>, all Vienna Secession. Facts are paraphrased; archival scans and museum photographs are not reproduced. Illustrations are original reconstructions for this experience. Ambience: <a href="https://freesound.org/people/visionear/sounds/563379/" target="_blank" rel="noreferrer">visionear via Freesound</a>, CC0. Della Respira and Josefin Sans are distributed under OFL-1.1. Full usage notes: SOURCES.md in the project repository.</p></details></nav>
        </article>
      </section>
    </main>
  );
}
