import { useEffect, useRef, useState } from 'react';

const SRC = '/music.mp3';
const KEY = 'shard-music-volume';

const DOOR = { cutoff: 600, dry: 0.4, wet: 0.7, time: 0.4 };
const OPEN = { cutoff: 18000, dry: 1, wet: 0, time: 0.4 };

function makeImpulse(ctx, seconds = 2.4, decay = 2.6) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
}

export default function MusicPlayer({ src = SRC }) {
    const audioRef = useRef(null);
    const graph = useRef(null);
    const doorRef = useRef(false);
    const volRef = useRef(0.4);
    const [playing, setPlaying] = useState(false);
    const [error, setError] = useState(false);
    const [vol, setVol] = useState(() => {
        try {
            const v = parseFloat(localStorage.getItem(KEY));
            return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.4;
        } catch { return 0.4; }
    });

    const applyDoor = (closed) => {
        const g = graph.current;
        if (!g) return;
        const { ctx, filter, dry, wet } = g;
        const t = ctx.currentTime, m = closed ? DOOR : OPEN;
        filter.frequency.cancelScheduledValues(t);
        filter.frequency.setTargetAtTime(m.cutoff, t, m.time / 3);
        dry.gain.setTargetAtTime(m.dry, t, m.time / 3);
        wet.gain.setTargetAtTime(m.wet, t, m.time / 3);
    };

    const buildGraph = () => {
        if (graph.current) return graph.current;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC || !audioRef.current) return null;
        const ctx = new AC();
        const src = ctx.createMediaElementSource(audioRef.current);
        const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = OPEN.cutoff; filter.Q.value = 0.7;
        const dry = ctx.createGain(); dry.gain.value = OPEN.dry;
        const wet = ctx.createGain(); wet.gain.value = OPEN.wet;
        const verb = ctx.createConvolver(); verb.buffer = makeImpulse(ctx);
        const master = ctx.createGain(); master.gain.value = volRef.current;
        src.connect(filter);
        filter.connect(dry); dry.connect(master);
        filter.connect(verb); verb.connect(wet); wet.connect(master);
        master.connect(ctx.destination);
        graph.current = { ctx, filter, dry, wet, master };
        applyDoor(doorRef.current);
        return graph.current;
    };

    useEffect(() => {
        volRef.current = vol;
        const g = graph.current;
        if (g) g.master.gain.setTargetAtTime(vol, g.ctx.currentTime, 0.02);
        try { localStorage.setItem(KEY, String(vol)); } catch { /* storage unavailable */ }
    }, [vol]);

    useEffect(() => {
        const hud = document.getElementById('hud');
        if (!hud) return undefined;
        const sync = () => {
            const open = hud.classList.contains('has-panel');
            if (open === doorRef.current) return;
            doorRef.current = open;
            applyDoor(open);
        };
        sync();
        const mo = new MutationObserver(sync);
        mo.observe(hud, { attributes: true, attributeFilter: ['class'] });
        return () => mo.disconnect();
    }, []);

    const toggle = async () => {
        const a = audioRef.current;
        if (!a) return;
        if (a.paused) {
            try {
                const g = buildGraph();
                if (g && g.ctx.state === 'suspended') await g.ctx.resume();
                await a.play();
            } catch { /* blocked or failed; error event handles missing file */ }
        }
        else a.pause();
    };

    return (
        <div className={'music' + (playing ? ' on' : '') + (error ? ' err' : '')} role="group" aria-label="Music player">
            <audio
                ref={audioRef}
                src={src}
                loop
                preload="none"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onError={() => setError(true)}
            />
            <div className="music-in">
                <button
                    type="button"
                    className="music-btn"
                    onClick={toggle}
                    aria-label={playing ? 'Pause music' : 'Play music'}
                    aria-pressed={playing}
                    title={error ? 'Audio file not found' : playing ? 'Pause' : 'Play'}
                >
                    {playing ? (
                        <svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1.5" width="2.8" height="9" /><rect x="7.2" y="1.5" width="2.8" height="9" /></svg>
                    ) : (
                        <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 1.2 10.5 6 2.5 10.8z" /></svg>
                    )}
                </button>
                <span className="music-eq" aria-hidden="true"><i /><i /><i /><i /></span>
                <input
                    className="music-vol"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={vol}
                    onChange={(e) => setVol(parseFloat(e.target.value))}
                    aria-label="Volume"
                    style={{ '--v': `${vol * 100}%` }}
                />
                <span className="music-read">{error ? 'N/A' : String(Math.round(vol * 100)).padStart(3, '0')}</span>
            </div>
        </div>
    );
}