// BuildQuest: Chiptune Audio Manager
// Generates all music and SFX programmatically using Web Audio API

class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.muted = false;
        this.musicMuted = false;
        this.sfxMuted = false;
        this.musicPlaying = false;
        this.musicNodes = [];
        this.musicTimeout = null;
        this.volume = 0.4;
        this._musicGeneration = 0; // incremented on each stop to invalidate stale loop callbacks
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.volume;
        this.masterGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.35;
        this.musicGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.5;
        this.sfxGain.connect(this.masterGain);
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().then(() => {
                this._tryStartPending();
            });
        }
    }

    // ── Note helpers ──

    noteFreq(note, octave) {
        const notes = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
        const semitone = notes[note];
        return 440 * Math.pow(2, (semitone - 9) / 12 + (octave - 4));
    }

    // Play a single tone
    playTone(freq, duration, type = 'square', gainNode = this.sfxGain, startTime = null) {
        if (!this.ctx || this.muted) return;
        const t = startTime || this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;
        osc.connect(env);
        env.connect(gainNode);

        // Envelope: quick attack, sustain, quick release
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.8, t + 0.01);
        env.gain.setValueAtTime(0.8, t + duration - 0.03);
        env.gain.linearRampToValueAtTime(0, t + duration);

        osc.start(t);
        osc.stop(t + duration);
        return osc;
    }

    // ── Sound Effects ──

    sfxJobPickup() {
        if (!this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        // Rising arpeggio — cheerful pickup sound
        this.playTone(this.noteFreq('C', 5), 0.08, 'square', this.sfxGain, t);
        this.playTone(this.noteFreq('E', 5), 0.08, 'square', this.sfxGain, t + 0.07);
        this.playTone(this.noteFreq('G', 5), 0.08, 'square', this.sfxGain, t + 0.14);
        this.playTone(this.noteFreq('C', 6), 0.12, 'square', this.sfxGain, t + 0.21);
    }

    sfxPowerUp() {
        if (!this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        // Sweep up — sparkly power-up
        for (let i = 0; i < 8; i++) {
            const freq = 400 + i * 120;
            this.playTone(freq, 0.06, 'square', this.sfxGain, t + i * 0.04);
        }
        // Shimmer on top
        this.playTone(this.noteFreq('C', 6), 0.2, 'triangle', this.sfxGain, t + 0.3);
    }

    sfxHit() {
        if (!this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        // Noise burst + low thud
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);
        osc.connect(env);
        env.connect(this.sfxGain);
        env.gain.setValueAtTime(0.6, t);
        env.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        osc.start(t);
        osc.stop(t + 0.2);

        // Crunch noise
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = this.ctx.createBufferSource();
        const noiseGain = this.ctx.createGain();
        noise.buffer = buffer;
        noise.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noiseGain.gain.setValueAtTime(0.3, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        noise.start(t);
    }

    sfxWaveComplete() {
        if (!this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        // Triumphant fanfare
        const melody = [
            ['C', 5, 0.12], ['E', 5, 0.12], ['G', 5, 0.12],
            ['C', 6, 0.25],
        ];
        let offset = 0;
        melody.forEach(([note, oct, dur]) => {
            this.playTone(this.noteFreq(note, oct), dur, 'square', this.sfxGain, t + offset);
            this.playTone(this.noteFreq(note, oct - 1), dur, 'triangle', this.sfxGain, t + offset);
            offset += dur * 0.85;
        });
    }

    sfxGameOver() {
        if (!this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        // Descending sad tones
        const notes = [
            ['G', 4, 0.2], ['E', 4, 0.2], ['C', 4, 0.2], ['G', 3, 0.4],
        ];
        let offset = 0;
        notes.forEach(([note, oct, dur]) => {
            this.playTone(this.noteFreq(note, oct), dur, 'triangle', this.sfxGain, t + offset);
            offset += dur * 0.9;
        });
    }

    sfxMenuSelect() {
        if (!this.ctx) return;
        this.resume();
        this._tryStartPending();
        const t = this.ctx.currentTime;
        this.playTone(this.noteFreq('E', 5), 0.06, 'square', this.sfxGain, t);
        this.playTone(this.noteFreq('A', 5), 0.1, 'square', this.sfxGain, t + 0.06);
    }

    sfxOpsAI() {
        if (!this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;

        // Dramatic power-up fanfare — ascending sweep + triumphant chord
        // Big sweep up
        for (let i = 0; i < 12; i++) {
            const freq = 200 + i * 150;
            this.playTone(freq, 0.08, 'square', this.sfxGain, t + i * 0.03);
        }

        // Explosion burst (noise hit)
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.15);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }
        const noise = this.ctx.createBufferSource();
        const noiseGain = this.ctx.createGain();
        noise.buffer = buffer;
        noise.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noiseGain.gain.setValueAtTime(0.4, t + 0.35);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        noise.start(t + 0.35);

        // Triumphant chord: C major with octave
        const chordTime = t + 0.4;
        this.playTone(this.noteFreq('C', 5), 0.4, 'square', this.sfxGain, chordTime);
        this.playTone(this.noteFreq('E', 5), 0.4, 'square', this.sfxGain, chordTime);
        this.playTone(this.noteFreq('G', 5), 0.4, 'square', this.sfxGain, chordTime);
        this.playTone(this.noteFreq('C', 6), 0.5, 'square', this.sfxGain, chordTime + 0.05);

        // Shimmering high note
        this.playTone(this.noteFreq('E', 6), 0.6, 'triangle', this.sfxGain, chordTime + 0.1);
        this.playTone(this.noteFreq('G', 6), 0.5, 'triangle', this.sfxGain, chordTime + 0.15);

        // Bass boom
        this.playTone(this.noteFreq('C', 3), 0.5, 'triangle', this.sfxGain, chordTime);
    }

    // ── Game Over Screen SFX ──

    // Rapid tick while score counter is climbing
    sfxScoreTick() {
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;
        this.playTone(800, 0.03, 'square', this.sfxGain, t);
    }

    // Chime when a tier is reached — pitch ascends with tier index (0-7)
    sfxTierReached(tierIndex) {
        if (!this.ctx || this.sfxMuted) return;
        this.resume();
        const t = this.ctx.currentTime;
        // Base note C4, ascending by major thirds for each tier
        const baseNotes = [
            ['C', 4], ['E', 4], ['G', 4], ['C', 5],
            ['E', 5], ['G', 5], ['C', 6], ['E', 6],
        ];
        const [note, oct] = baseNotes[Math.min(tierIndex, 7)];
        const freq = this.noteFreq(note, oct);
        // Two-tone chime: root + fifth
        this.playTone(freq, 0.15, 'square', this.sfxGain, t);
        this.playTone(freq * 1.5, 0.15, 'square', this.sfxGain, t + 0.08);
        // Shimmer
        this.playTone(freq * 2, 0.2, 'triangle', this.sfxGain, t + 0.14);
    }

    // Final "ka-ching" when score counter lands on the final number
    sfxScoreFinish() {
        if (!this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        // Bright chord burst
        this.playTone(this.noteFreq('C', 5), 0.12, 'square', this.sfxGain, t);
        this.playTone(this.noteFreq('E', 5), 0.12, 'square', this.sfxGain, t + 0.03);
        this.playTone(this.noteFreq('G', 5), 0.12, 'square', this.sfxGain, t + 0.06);
        this.playTone(this.noteFreq('C', 6), 0.2, 'triangle', this.sfxGain, t + 0.1);
        // Metallic ring
        this.playTone(this.noteFreq('E', 6), 0.25, 'triangle', this.sfxGain, t + 0.15);
    }

    // Subtle pop for each stat row appearing
    sfxStatPop() {
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;
        this.playTone(600, 0.04, 'triangle', this.sfxGain, t);
    }

    // Gentle whoosh when buttons appear
    sfxRevealButtons() {
        if (!this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        // Soft descending sweep
        for (let i = 0; i < 4; i++) {
            const freq = 500 - i * 80;
            this.playTone(freq, 0.06, 'triangle', this.sfxGain, t + i * 0.04);
        }
    }

    sfxStreakBonus() {
        if (!this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        // Quick ascending sparkle
        this.playTone(this.noteFreq('E', 5), 0.06, 'square', this.sfxGain, t);
        this.playTone(this.noteFreq('G', 5), 0.06, 'square', this.sfxGain, t + 0.05);
        this.playTone(this.noteFreq('B', 5), 0.06, 'square', this.sfxGain, t + 0.10);
        this.playTone(this.noteFreq('E', 6), 0.15, 'triangle', this.sfxGain, t + 0.15);
    }

    // Sad descending tone when streak resets to 0
    sfxStreakLost() {
        if (!this.ctx || this.sfxMuted) return;
        this.resume();
        const t = this.ctx.currentTime;
        this.playTone(this.noteFreq('E', 5), 0.08, 'triangle', this.sfxGain, t);
        this.playTone(this.noteFreq('C', 5), 0.12, 'triangle', this.sfxGain, t + 0.07);
    }

    // Heartbeat pulse when health is critically low (1-2 HP)
    sfxLowHealth() {
        if (!this.ctx || this.sfxMuted) return;
        this.resume();
        const t = this.ctx.currentTime;
        // Double-beat heartbeat: thump-thump
        this.playTone(60, 0.06, 'sine', this.sfxGain, t);
        this.playTone(55, 0.08, 'sine', this.sfxGain, t + 0.12);
    }

    // Descending chirp when a power-up expires
    sfxPowerUpExpire() {
        if (!this.ctx || this.sfxMuted) return;
        this.resume();
        const t = this.ctx.currentTime;
        this.playTone(this.noteFreq('G', 5), 0.05, 'triangle', this.sfxGain, t);
        this.playTone(this.noteFreq('D', 5), 0.05, 'triangle', this.sfxGain, t + 0.05);
        this.playTone(this.noteFreq('B', 4), 0.08, 'triangle', this.sfxGain, t + 0.10);
    }

    // Warning chirp ~2s before power-up expires
    sfxPowerUpWarning() {
        if (!this.ctx || this.sfxMuted) return;
        this.resume();
        const t = this.ctx.currentTime;
        this.playTone(this.noteFreq('A', 5), 0.04, 'square', this.sfxGain, t);
        this.playTone(this.noteFreq('A', 5), 0.04, 'square', this.sfxGain, t + 0.08);
    }

    // Soft sparkle when a power-up appears on the map
    sfxPowerUpSpawn() {
        if (!this.ctx || this.sfxMuted) return;
        this.resume();
        const t = this.ctx.currentTime;
        this.playTone(this.noteFreq('C', 6), 0.08, 'triangle', this.sfxGain, t);
        this.playTone(this.noteFreq('E', 6), 0.1, 'triangle', this.sfxGain, t + 0.06);
    }

    // Big satisfying explosion for Workflow Automator clearing all obstacles
    sfxWorkflowClear() {
        if (!this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        // Rapid ascending sweep
        for (let i = 0; i < 6; i++) {
            this.playTone(200 + i * 200, 0.05, 'square', this.sfxGain, t + i * 0.02);
        }
        // Burst noise
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.2);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
        }
        const noise = this.ctx.createBufferSource();
        const noiseGain = this.ctx.createGain();
        noise.buffer = buffer;
        noise.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noiseGain.gain.setValueAtTime(0.5, t + 0.1);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        noise.start(t + 0.1);
        // Triumphant resolve
        this.playTone(this.noteFreq('C', 5), 0.25, 'square', this.sfxGain, t + 0.2);
        this.playTone(this.noteFreq('G', 5), 0.25, 'triangle', this.sfxGain, t + 0.22);
    }

    // Sonar ping for Smart Dispatch radar
    sfxSmartDispatch() {
        if (!this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        // Ping - ascending two-tone with echo
        this.playTone(this.noteFreq('E', 5), 0.1, 'sine', this.sfxGain, t);
        this.playTone(this.noteFreq('B', 5), 0.15, 'sine', this.sfxGain, t + 0.08);
        // Echo (quieter repeat)
        this.playTone(this.noteFreq('E', 5), 0.06, 'triangle', this.sfxGain, t + 0.25);
        this.playTone(this.noteFreq('B', 5), 0.08, 'triangle', this.sfxGain, t + 0.3);
    }

    // Metallic clang for shield activation
    sfxShieldOn() {
        if (!this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        this.playTone(this.noteFreq('C', 6), 0.08, 'square', this.sfxGain, t);
        this.playTone(this.noteFreq('G', 5), 0.12, 'square', this.sfxGain, t + 0.04);
        this.playTone(this.noteFreq('C', 6), 0.2, 'triangle', this.sfxGain, t + 0.08);
    }

    // Glass shatter for shield deactivation
    sfxShieldOff() {
        if (!this.ctx || this.sfxMuted) return;
        this.resume();
        const t = this.ctx.currentTime;
        // Quick descending shatter
        this.playTone(this.noteFreq('B', 5), 0.04, 'square', this.sfxGain, t);
        this.playTone(this.noteFreq('G', 5), 0.04, 'square', this.sfxGain, t + 0.03);
        this.playTone(this.noteFreq('D', 5), 0.04, 'square', this.sfxGain, t + 0.06);
        this.playTone(this.noteFreq('B', 4), 0.08, 'triangle', this.sfxGain, t + 0.09);
    }

    // Tiny tick for menu hover
    sfxMenuHover() {
        if (!this.ctx || this.sfxMuted) return;
        this.resume();
        const t = this.ctx.currentTime;
        this.playTone(500, 0.02, 'triangle', this.sfxGain, t);
    }

    // Level start "GO!" ding
    sfxLevelStart() {
        if (!this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        this.playTone(this.noteFreq('G', 5), 0.08, 'square', this.sfxGain, t);
        this.playTone(this.noteFreq('C', 6), 0.15, 'square', this.sfxGain, t + 0.08);
        this.playTone(this.noteFreq('E', 6), 0.2, 'triangle', this.sfxGain, t + 0.16);
    }

    // Dispatch horn for character select confirmation
    sfxDispatch() {
        if (!this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        // Two-tone horn
        this.playTone(this.noteFreq('C', 4), 0.15, 'sawtooth', this.sfxGain, t);
        this.playTone(this.noteFreq('G', 4), 0.2, 'sawtooth', this.sfxGain, t + 0.12);
        this.playTone(this.noteFreq('C', 5), 0.25, 'square', this.sfxGain, t + 0.25);
    }

    // ── Background Music ──

    startMusic(trackName = 'game') {
        if (!this.ctx) return;
        // Always stop first to prevent overlap
        this.stopMusic();
        this.resume();
        this.currentTrack = trackName;

        // Don't play if music is muted
        if (this.musicMuted) return;

        // Don't schedule if context is suspended — wait for user gesture
        if (this.ctx.state === 'suspended') {
            this._pendingTrack = trackName;
            return;
        }

        this.musicPlaying = true;
        if (this.musicGain) {
            this.musicGain.gain.value = 0.35;
        }

        if (trackName === 'menu') {
            this._playMenuLoop();
        } else {
            this._playGameLoop();
        }
    }

    // Call this on any user interaction to kick off pending music
    _tryStartPending() {
        if (this._pendingTrack && this.ctx && this.ctx.state === 'running') {
            const track = this._pendingTrack;
            this._pendingTrack = null;
            this.startMusic(track);
        }
    }

    stopMusic() {
        this.musicPlaying = false;
        this._pendingTrack = null;
        this._musicGeneration++;
        if (this.musicTimeout) {
            clearTimeout(this.musicTimeout);
            this.musicTimeout = null;
        }
        // Stop all tracked nodes
        this.musicNodes.forEach(n => { try { n.stop(); } catch (e) {} });
        this.musicNodes = [];
        // Disconnect music gain to kill any stragglers, then reconnect
        if (this.musicGain && this.masterGain) {
            this.musicGain.disconnect();
            this.musicGain.connect(this.masterGain);
            // Restore mute state after reconnect
            this.musicGain.gain.value = this.musicMuted ? 0 : 0.35;
        }
    }

    _scheduleNote(freq, start, duration, type, gain) {
        if (!this.ctx || !this.musicPlaying) return;
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        osc.connect(env);
        env.connect(gain);

        env.gain.setValueAtTime(0, start);
        env.gain.linearRampToValueAtTime(0.7, start + 0.01);
        env.gain.setValueAtTime(0.7, start + duration * 0.7);
        env.gain.linearRampToValueAtTime(0, start + duration);

        osc.start(start);
        osc.stop(start + duration);
        this.musicNodes.push(osc);
    }

    _playMenuLoop() {
        if (!this.ctx || !this.musicPlaying) return;
        const gen = this._musicGeneration;

        const t = this.ctx.currentTime + 0.05;
        const bpm = 90;
        const beat = 60 / bpm;
        const n = (note, oct) => this.noteFreq(note, oct);

        // Gentle ambient melody — arpeggiated chords
        // Am - F - C - G pattern, 2 bars each = 16 beats total
        const chords = [
            [['A', 3], ['C', 4], ['E', 4]],
            [['F', 3], ['A', 3], ['C', 4]],
            [['C', 3], ['E', 3], ['G', 3]],
            [['G', 3], ['B', 3], ['D', 4]],
        ];

        let time = t;
        chords.forEach((chord) => {
            // Arpeggio pattern over 4 beats
            for (let rep = 0; rep < 2; rep++) {
                chord.forEach(([note, oct], i) => {
                    this._scheduleNote(n(note, oct), time + i * beat * 0.5, beat * 0.45, 'triangle', this.musicGain);
                });
                // High melody note
                const melodyNote = chord[2];
                this._scheduleNote(n(melodyNote[0], melodyNote[1] + 1), time + beat * 1.5, beat * 0.4, 'square', this.musicGain);
                time += beat * 2;
            }
        });

        // Bass line
        const bassNotes = [['A', 2], ['F', 2], ['C', 2], ['G', 2]];
        let bassTime = t;
        bassNotes.forEach(([note, oct]) => {
            for (let rep = 0; rep < 2; rep++) {
                this._scheduleNote(n(note, oct), bassTime, beat * 1.8, 'triangle', this.musicGain);
                bassTime += beat * 2;
            }
        });

        const loopDuration = beat * 16;
        this.musicTimeout = setTimeout(() => {
            if (this._musicGeneration !== gen) return; // stale callback — music was restarted
            this.musicNodes.forEach(n => { try { n.stop(); } catch (e) {} });
            this.musicNodes = [];
            if (this.musicPlaying) this._playMenuLoop();
        }, loopDuration * 1000 - 50);
    }

    _playGameLoop() {
        if (!this.ctx || !this.musicPlaying) return;
        const gen = this._musicGeneration;

        const t = this.ctx.currentTime + 0.05;
        // BPM increases slightly with level for escalating tension (140 → max 170)
        const bpm = Math.min(170, 140 + (this._gameLevel || 0) * 3);
        const beat = 60 / bpm;
        const n = (note, oct) => this.noteFreq(note, oct);

        // Energetic chiptune — 16 beat loop
        // Melody: square wave lead
        const melody = [
            ['E', 5, 1], ['E', 5, 0.5], ['G', 5, 0.5], ['A', 5, 1], ['G', 5, 0.5], ['E', 5, 0.5],
            ['D', 5, 1], ['C', 5, 0.5], ['D', 5, 0.5], ['E', 5, 2],
            ['D', 5, 1], ['D', 5, 0.5], ['E', 5, 0.5], ['G', 5, 1], ['E', 5, 0.5], ['D', 5, 0.5],
            ['C', 5, 1], ['B', 4, 0.5], ['A', 4, 0.5], ['C', 5, 2],
        ];

        let melTime = t;
        melody.forEach(([note, oct, beats]) => {
            this._scheduleNote(n(note, oct), melTime, beat * beats * 0.85, 'square', this.musicGain);
            melTime += beat * beats;
        });

        // Bass: triangle wave
        const bass = [
            ['A', 2, 2], ['A', 2, 2], ['F', 2, 2], ['F', 2, 2],
            ['C', 3, 2], ['C', 3, 2], ['G', 2, 2], ['G', 2, 2],
            ['D', 2, 2], ['D', 2, 2], ['E', 2, 2], ['E', 2, 2],
            ['A', 2, 2], ['A', 2, 2], ['A', 2, 1], ['B', 2, 1], ['C', 3, 1], ['D', 3, 1],
        ];

        let bassTime = t;
        bass.forEach(([note, oct, beats]) => {
            this._scheduleNote(n(note, oct), bassTime, beat * beats * 0.9, 'triangle', this.musicGain);
            bassTime += beat * beats;
        });

        // Harmony: soft square wave chords
        const harmony = [
            [['C', 4, 'E', 4], 4], [['A', 3, 'C', 4], 4],
            [['E', 4, 'G', 4], 4], [['C', 4, 'E', 4], 4],
            [['F', 3, 'A', 3], 4], [['G', 3, 'B', 3], 4],
            [['A', 3, 'C', 4], 4], [['A', 3, 'E', 4], 4],
        ];

        const harmGain = this.ctx.createGain();
        harmGain.gain.value = 0.15;
        harmGain.connect(this.musicGain);

        let harmTime = t;
        harmony.forEach(([notes, beats]) => {
            this._scheduleNote(n(notes[0], notes[1]), harmTime, beat * beats * 0.85, 'square', harmGain);
            this._scheduleNote(n(notes[2], notes[3]), harmTime, beat * beats * 0.85, 'square', harmGain);
            harmTime += beat * beats;
        });

        // Percussion: noise hits on beats
        for (let i = 0; i < 16; i++) {
            const time = t + i * beat * 2;
            this._schedulePercHit(time, 0.04, 0.25);
            // Off-beat hi-hat
            this._schedulePercHit(time + beat, 0.02, 0.1);
        }

        const loopDuration = beat * 32;
        this.musicTimeout = setTimeout(() => {
            if (this._musicGeneration !== gen) return; // stale callback — music was restarted
            this.musicNodes.forEach(n => { try { n.stop(); } catch (e) {} });
            this.musicNodes = [];
            if (this.musicPlaying) this._playGameLoop();
        }, loopDuration * 1000 - 50);
    }

    _schedulePercHit(time, duration, volume) {
        if (!this.ctx || !this.musicPlaying) return;
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const source = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        source.buffer = buffer;
        source.connect(gain);
        gain.connect(this.musicGain);
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        source.start(time);
        source.stop(time + duration);
        this.musicNodes.push(source);
    }

    // ── Controls ──

    toggleMute() {
        this.muted = !this.muted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.muted ? 0 : this.volume;
        }
        return this.muted;
    }

    toggleMusic() {
        this.musicMuted = !this.musicMuted;
        this.resume();
        if (this.musicMuted) {
            // Stop all music playback
            this._stopMusicPlayback();
        } else {
            // Restart music if we have a track
            if (this.currentTrack && !this.musicPlaying) {
                this.startMusic(this.currentTrack);
            }
        }
        return this.musicMuted;
    }

    // Stop playback without clearing currentTrack
    _stopMusicPlayback() {
        this.musicPlaying = false;
        this._musicGeneration++;
        if (this.musicTimeout) {
            clearTimeout(this.musicTimeout);
            this.musicTimeout = null;
        }
        this.musicNodes.forEach(n => { try { n.stop(); } catch (e) {} });
        this.musicNodes = [];
        if (this.musicGain && this.masterGain) {
            this.musicGain.disconnect();
            this.musicGain.connect(this.masterGain);
        }
    }

    toggleSfx() {
        this.sfxMuted = !this.sfxMuted;
        this.resume();
        if (this.sfxGain && this.ctx) {
            this.sfxGain.gain.cancelScheduledValues(this.ctx.currentTime);
            this.sfxGain.gain.setValueAtTime(this.sfxMuted ? 0 : 0.5, this.ctx.currentTime);
        }
        return this.sfxMuted;
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.masterGain && !this.muted) {
            this.masterGain.gain.value = this.volume;
        }
    }

    // Add music/sfx toggle UI to a Phaser scene (bottom-right)
    createControls(scene) {
        const w = scene.cameras.main.width;
        const h = scene.cameras.main.height;
        const offColor = '#4b5563';
        const onColor = '#4ade80';
        const depth = 100;

        const musicText = scene.add.text(w - 14, h - 28, this.musicMuted ? '♪ OFF' : '♪ ON', {
            fontSize: '10px',
            fontFamily: 'monospace',
            color: this.musicMuted ? offColor : onColor,
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }).setDepth(depth);

        const sfxText = scene.add.text(w - 14, h - 14, this.sfxMuted ? 'SFX OFF' : 'SFX ON', {
            fontSize: '10px',
            fontFamily: 'monospace',
            color: this.sfxMuted ? offColor : onColor,
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }).setDepth(depth);

        musicText.on('pointerdown', () => {
            const muted = this.toggleMusic();
            musicText.setText(muted ? '♪ OFF' : '♪ ON');
            musicText.setColor(muted ? offColor : onColor);
        });
        musicText.on('pointerover', () => musicText.setColor('#ffffff'));
        musicText.on('pointerout', () => musicText.setColor(this.musicMuted ? offColor : onColor));

        sfxText.on('pointerdown', () => {
            const muted = this.toggleSfx();
            sfxText.setText(muted ? 'SFX OFF' : 'SFX ON');
            sfxText.setColor(muted ? offColor : onColor);
        });
        sfxText.on('pointerover', () => sfxText.setColor('#ffffff'));
        sfxText.on('pointerout', () => sfxText.setColor(this.sfxMuted ? offColor : onColor));
    }
}

// Singleton
const audioManager = new AudioManager();
export default audioManager;
