import numpy as np
import scipy.io.wavfile as wav
import os

SAMPLE_RATE = 48000
DURATION = 18.5
TOTAL_SAMPLES = int(SAMPLE_RATE * DURATION)

t = np.linspace(0, DURATION, TOTAL_SAMPLES, endpoint=False)
left = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
right = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

def add_tone(start_s, duration_s, freq, gain=0.2, decay=True, pan=0.0, waveform='sine'):
    start_idx = int(start_s * SAMPLE_RATE)
    end_idx = min(start_idx + int(duration_s * SAMPLE_RATE), TOTAL_SAMPLES)
    if start_idx >= TOTAL_SAMPLES:
        return
    n = end_idx - start_idx
    tn = np.linspace(0, duration_s, n, endpoint=False)
    
    if waveform == 'sine':
        sig = np.sin(2 * np.pi * freq * tn)
    elif waveform == 'saw':
        sig = 2.0 * (tn * freq - np.floor(tn * freq + 0.5))
    elif waveform == 'square':
        sig = np.sign(np.sin(2 * np.pi * freq * tn))
    elif waveform == 'triangle':
        sig = 2.0 * np.abs(2.0 * (tn * freq - np.floor(tn * freq + 0.5))) - 1.0
    else:
        sig = np.sin(2 * np.pi * freq * tn)
        
    if decay:
        env = np.exp(-3.5 * tn / duration_s)
    else:
        # smooth attack and release
        attack = int(min(0.02 * SAMPLE_RATE, n / 4))
        release = int(min(0.05 * SAMPLE_RATE, n / 4))
        env = np.ones(n)
        if attack > 0:
            env[:attack] = np.linspace(0, 1, attack)
        if release > 0:
            env[-release:] = np.linspace(1, 0, release)
            
    val = sig * env * gain
    # panning: -1 = left, 0 = center, +1 = right
    l_gain = np.cos((pan + 1) * np.pi / 4)
    r_gain = np.sin((pan + 1) * np.pi / 4)
    
    global left, right
    left[start_idx:end_idx] += val * l_gain
    right[start_idx:end_idx] += val * r_gain

def add_sub_drop(start_s, duration_s, start_f=140, end_f=35, gain=0.45):
    start_idx = int(start_s * SAMPLE_RATE)
    end_idx = min(start_idx + int(duration_s * SAMPLE_RATE), TOTAL_SAMPLES)
    n = end_idx - start_idx
    tn = np.linspace(0, duration_s, n, endpoint=False)
    # exponential frequency sweep
    f_inst = start_f * ((end_f / start_f) ** (tn / duration_s))
    phase = 2 * np.pi * np.cumsum(f_inst) / SAMPLE_RATE
    env = np.exp(-2.5 * tn / duration_s)
    val = np.sin(phase) * env * gain
    global left, right
    left[start_idx:end_idx] += val
    right[start_idx:end_idx] += val

def add_riser(start_s, duration_s, start_f=120, end_f=1400, gain=0.25):
    start_idx = int(start_s * SAMPLE_RATE)
    end_idx = min(start_idx + int(duration_s * SAMPLE_RATE), TOTAL_SAMPLES)
    n = end_idx - start_idx
    tn = np.linspace(0, duration_s, n, endpoint=False)
    f_inst = start_f * ((end_f / start_f) ** (tn / duration_s))
    phase = 2 * np.pi * np.cumsum(f_inst) / SAMPLE_RATE
    # attack ramp
    env = (tn / duration_s) ** 2 * (1.0 - np.exp(-15 * (1.0 - tn / duration_s)))
    noise = np.random.normal(0, 0.2, n)
    val = (np.sin(phase) * 0.7 + noise * 0.3) * env * gain
    global left, right
    left[start_idx:end_idx] += val
    right[start_idx:end_idx] += val

print("Synthesizing audio layers...")

# 1. 0.0s - 3.0s: Ambient Drone & Tension
add_sub_drop(0.0, 2.5, 75, 45, 0.35)
for sec in [0.0, 0.8, 1.6, 2.4]:
    add_tone(sec, 0.12, 110, gain=0.08, pan=-0.2)

# 1.6s: Payment Failure Alarm Dissonance
add_tone(1.6, 0.25, 880, gain=0.3, waveform='saw', pan=-0.3)
add_tone(1.6, 0.25, 824, gain=0.25, waveform='saw', pan=0.3) # tritone clash
add_tone(1.85, 0.35, 587, gain=0.28, waveform='square', pan=0.0)
add_tone(2.1, 0.45, 440, gain=0.25, waveform='saw', pan=0.0)

# 2. 3.0s - 6.0s: Meet ReviveAI Logo Entrance
add_riser(3.0, 2.2, 110, 1600, gain=0.3)
add_sub_drop(3.0, 2.2, 150, 36, gain=0.5)
# Sparkling harmonic shimmers
shimmers = [523.25, 659.25, 783.99, 1046.50, 1318.51]
for i, sf in enumerate(shimmers):
    add_tone(3.4 + i * 0.08, 0.8, sf, gain=0.12, pan=(i-2)*0.3)

# 3. 6.0s - 11.0s: Key Features Sequencer (130 BPM = ~0.46s per beat, ~0.115s per 16th note)
beat_s = 60.0 / 130.0
for step in range(22):
    step_time = 6.0 + step * (beat_s / 2)
    if step_time > 10.9:
        break
    base_f = [110, 130.8, 146.8, 164.8, 110, 164.8, 196, 220][step % 8]
    add_tone(step_time, 0.09, base_f, gain=0.18, pan=(step % 2 - 0.5) * 0.4, waveform='triangle')
    # High tech telemetry blips
    if step % 3 == 0:
        add_tone(step_time, 0.06, base_f * 4, gain=0.09, pan=0.4, waveform='sine')

# Key features specific sound cues
add_tone(6.2, 0.4, 880, gain=0.22, pan=-0.2) # diagnosis ping
add_tone(7.6, 0.35, 1046.5, gain=0.22, pan=0.2) # strategy selected
add_tone(9.2, 0.5, 1318.5, gain=0.25, pan=0.0) # explainable reasoning card pop

# 4. 11.0s - 15.0s: Deterministic Guardrails (4 heavy locking chimes)
guard_times = [11.2, 12.0, 12.8, 13.6]
guard_freqs = [329.63, 440.0, 554.37, 659.25]
for i, (gt, gf) in enumerate(zip(guard_times, guard_freqs)):
    add_sub_drop(gt, 0.4, 90, 40, gain=0.35) # metallic thud
    add_tone(gt, 0.6, gf, gain=0.28, waveform='triangle', pan=(i - 1.5) * 0.3)
    add_tone(gt, 0.3, gf * 2, gain=0.15, waveform='sine', pan=(i - 1.5) * 0.3)

# 5. 15.0s - 18.5s: The Impact & Grand Finale
add_sub_drop(15.0, 2.2, 160, 34, gain=0.55) # massive impact boom
# Ascending crystal victory arpeggio
settled_notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]
for i, nf in enumerate(settled_notes):
    add_tone(15.0 + i * 0.07, 1.2, nf, gain=0.22, pan=(i - 2.5) * 0.25)

# Grand Outro Chord (C major 9)
outro_chord = [130.81, 196.00, 261.63, 329.63, 392.00, 493.88, 587.33]
for cf in outro_chord:
    add_tone(16.4, 2.0, cf, gain=0.15, pan=0.0, decay=False)

# Final Brand Sonic Logo Sting (3 distinct futuristic notes)
brand_sting = [(16.6, 698.46), (16.85, 830.61), (17.15, 1046.50)] # F5 -> Ab5 -> C6
for st, sf in brand_sting:
    add_tone(st, 0.9, sf, gain=0.25, waveform='triangle', pan=0.0)

# Master Limiter & Normalization
max_val = max(np.max(np.abs(left)), np.max(np.abs(right)))
if max_val > 0.95:
    left = (left / max_val) * 0.92
    right = (right / max_val) * 0.92

# Fade out last 0.3s
fade_len = int(0.3 * SAMPLE_RATE)
fade = np.linspace(1.0, 0.0, fade_len)
left[-fade_len:] *= fade
right[-fade_len:] *= fade

stereo = np.vstack((left, right)).T
stereo_int16 = (stereo * 32767).astype(np.int16)

out_wav = 'reviveai_audio.wav'
wav.write(out_wav, SAMPLE_RATE, stereo_int16)
print(f"Audio synthesized successfully: {out_wav} ({DURATION}s, {SAMPLE_RATE}Hz, Stereo 16-bit)")
