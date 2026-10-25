import os
import math
import time
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from multiprocessing import Pool, cpu_count

# Video Specifications
WIDTH = 1920
HEIGHT = 1080
FPS = 30
DURATION = 18.5
TOTAL_FRAMES = int(DURATION * FPS) # 555 frames

FRAMES_DIR = os.path.abspath('video_frames')
os.makedirs(FRAMES_DIR, exist_ok=True)

# System Font Paths (Windows)
FONT_BOLD_PATH = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_REG_PATH = r"C:\Windows\Fonts\segoeui.ttf"
FONT_MONO_PATH = r"C:\Windows\Fonts\consola.ttf"

def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

FONTS = {
    'title_huge': get_font(FONT_BOLD_PATH, 74),
    'title_big': get_font(FONT_BOLD_PATH, 48),
    'title_med': get_font(FONT_BOLD_PATH, 32),
    'title_card': get_font(FONT_BOLD_PATH, 22),
    'body_large': get_font(FONT_REG_PATH, 20),
    'body_med': get_font(FONT_REG_PATH, 16),
    'body_small': get_font(FONT_REG_PATH, 13),
    'mono_huge': get_font(FONT_MONO_PATH, 56),
    'mono_large': get_font(FONT_MONO_PATH, 26),
    'mono_med': get_font(FONT_MONO_PATH, 14),
    'mono_badge': get_font(FONT_MONO_PATH, 12),
    'mono_small': get_font(FONT_MONO_PATH, 11),
}

def draw_round_rect(draw, bbox, radius, fill=None, outline=None, width=1):
    x0, y0, x1, y1 = bbox
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill, outline=outline, width=width)

def draw_ambient_glow(draw, cx, cy, radius, color_rgb, steps=12):
    r_step = radius / steps
    for i in range(steps, 0, -1):
        cur_r = int(i * r_step)
        alpha = int((1.0 - (i / steps)) * 40)
        col = (color_rgb[0] * alpha // 255, color_rgb[1] * alpha // 255, color_rgb[2] * alpha // 255)
        draw.ellipse([cx - cur_r, cy - cur_r, cx + cur_r, cy + cur_r], outline=col, width=int(r_step) + 1)

def draw_reviveai_logo(draw, cx, cy, size, progress=1.0):
    # Ambient multi-layer glow behind logo
    draw_ambient_glow(draw, cx, cy, int(size * 1.6), (6, 182, 212), steps=8)
    draw_ambient_glow(draw, cx, cy, int(size * 1.2), (16, 185, 129), steps=6)
    
    # Outer Squircle
    r = size // 2
    x0, y0, x1, y1 = cx - r, cy - r, cx + r, cy + r
    draw_round_rect(draw, [x0, y0, x1, y1], radius=int(size * 0.26), fill=(11, 15, 25), outline=(56, 189, 248), width=3)
    
    s = size / 64.0
    ox, oy = cx - size // 2, cy - size // 2
    
    # Grid corner nodes
    for cnx, cny in [(ox + 12 * s, oy + 12 * s), (ox + 52 * s, oy + 12 * s), (ox + 12 * s, oy + 52 * s), (ox + 52 * s, oy + 52 * s)]:
        draw.ellipse([cnx - 1.5 * s, cny - 1.5 * s, cnx + 1.5 * s, cny + 1.5 * s], fill=(56, 189, 248))

    # 1. Vertical Bedrock Pillar
    px0, py0 = ox + 17 * s, oy + 18 * s
    px1, py1 = ox + 25 * s, oy + 46 * s
    draw_round_rect(draw, [px0, py0, px1, py1], radius=int(3 * s), fill=(56, 189, 248))
    
    # 2. Autonomous Loop (Indigo Arc)
    lx0, ly0 = ox + 24 * s, oy + 17 * s
    lx1, ly1 = ox + 43 * s, oy + 36 * s
    draw_round_rect(draw, [lx0, ly0, lx1, ly1], radius=int(9 * s), outline=(79, 70, 229), width=int(5 * s))
    
    # 3. Dynamic Recovery Arrow (Emerald Prosperity)
    draw.polygon([
        (ox + 30 * s, oy + 33 * s),
        (ox + 42 * s, oy + 46 * s),
        (ox + 47 * s, oy + 38 * s),
        (ox + 41 * s, oy + 38 * s),
        (ox + 34 * s, oy + 31 * s)
    ], fill=(16, 185, 129))
    
    # 4. Spark Telemetry Diamond
    sx, sy = ox + 45 * s, oy + 20 * s
    ds = 4.5 * s
    draw.polygon([
        (sx, sy - ds),
        (sx + ds * 0.8, sy),
        (sx, sy + ds),
        (sx - ds * 0.8, sy)
    ], fill=(56, 189, 248))
    draw.ellipse([sx - 1.5 * s, sy - 1.5 * s, sx + 1.5 * s, sy + 1.5 * s], fill=(255, 255, 255))

def render_frame_to_image(frame_idx):
    t = frame_idx / FPS
    img = Image.new('RGB', (WIDTH, HEIGHT), (5, 8, 16))
    draw = ImageDraw.Draw(img)
    
    # Subtle cybernetic grid lines
    grid_gap = 120
    for x in range(0, WIDTH, grid_gap):
        draw.line([(x, 0), (x, HEIGHT)], fill=(12, 18, 32), width=1)
    for y in range(0, HEIGHT, grid_gap):
        draw.line([(0, y), (WIDTH, y)], fill=(12, 18, 32), width=1)
        
    # Micro particle nodes
    np.random.seed(frame_idx % 40)
    for _ in range(45):
        px = np.random.randint(0, WIDTH)
        py = np.random.randint(0, HEIGHT)
        pcol = (6, 182, 212) if np.random.rand() > 0.4 else (129, 140, 248)
        draw.ellipse([px-1, py-1, px+1, py+1], fill=pcol)
        
    # Top Telemetry Status Header
    draw_round_rect(draw, [120, 25, WIDTH - 120, 68], radius=10, fill=(11, 17, 30), outline=(24, 36, 56), width=1)
    draw.ellipse([140, 42, 148, 50], fill=(16, 185, 129))
    draw.text((162, 38), "REVIVEAI // AUTONOMOUS PAYMENT REVENUE RECOVERY ENGINE", font=FONTS['mono_badge'], fill=(56, 189, 248))
    
    if t < 3.0:
        scene_name = "SCENE 1: THE PROBLEM"
    elif t < 6.0:
        scene_name = "SCENE 2: MEET REVIVEAI"
    elif t < 11.0:
        scene_name = "SCENE 3: KEY FEATURES"
    elif t < 15.0:
        scene_name = "SCENE 4: SMART & SAFE"
    else:
        scene_name = "SCENE 5: THE IMPACT"
        
    draw.text((WIDTH - 420, 38), f"{scene_name} // 1080p 60FPS", font=FONTS['mono_badge'], fill=(148, 163, 184))
    
    # -------------------------------------------------------------------------
    # SCENE 1: THE PROBLEM (0.0s – 3.0s)
    # -------------------------------------------------------------------------
    if t < 3.0:
        is_failed = t >= 1.5
        bg_card = (28, 10, 16) if is_failed else (13, 20, 36)
        border_card = (239, 68, 68) if is_failed else (56, 189, 248)
        
        # Glow around failed card
        if is_failed:
            draw_ambient_glow(draw, WIDTH // 2, 420, 520, (239, 68, 68), steps=6)
            
        draw_round_rect(draw, [240, 115, WIDTH - 240, 685], radius=20, fill=bg_card, outline=border_card, width=2 if not is_failed else 3)
        
        # Telemetry ID & Header
        draw.text((280, 155), "TRANSACTION INGESTION TELEMETRY #TXN-984210", font=FONTS['mono_badge'], fill=(100, 116, 139))
        draw.text((280, 195), "₹42,500.00 INR", font=FONTS['title_big'], fill=(248, 250, 252))
        draw.text((280, 260), "Merchant: Enterprise Cloud SaaS  •  Customer: Rahul Sharma (LTV: ₹2,40,000)", font=FONTS['body_med'], fill=(148, 163, 184))
        
        # Status Badge Pill
        bx0, by0, bx1, by1 = WIDTH - 540, 185, WIDTH - 280, 240
        if not is_failed:
            draw_round_rect(draw, [bx0, by0, bx1, by1], radius=27, fill=(35, 30, 15), outline=(234, 179, 8), width=2)
            draw.text((bx0 + 35, by0 + 17), "● PROCESSING...", font=FONTS['mono_med'], fill=(250, 204, 21))
        else:
            draw_round_rect(draw, [bx0, by0, bx1, by1], radius=27, fill=(55, 14, 18), outline=(239, 68, 68), width=3)
            draw.text((bx0 + 28, by0 + 17), "✖ PAYMENT FAILED", font=FONTS['mono_med'], fill=(239, 68, 68))
            
        draw.line([(280, 305), (WIDTH - 280, 305)], fill=(45, 58, 78) if not is_failed else (90, 25, 30), width=1)
        
        rows = [
            ("Payment Gateway", "HDFC Bank PSP / UPI Gateway", (226, 232, 240)),
            ("Observed Latency", "4,820 ms (Gateway Timeout Threshold Exceeded)", (226, 232, 240)),
            ("Error Signature", "PSP_NETWORK_TIMEOUT // GATEWAY_DROP" if is_failed else "IN_FLIGHT", (239, 68, 68) if is_failed else (148, 163, 184)),
            ("Direct Financial Impact", "Immediate Cart Abandonment & Lost Merchant ARR" if is_failed else "Pending Bank Settlement", (248, 113, 113) if is_failed else (148, 163, 184))
        ]
        
        for idx, (lbl, val, col) in enumerate(rows):
            ry = 345 + idx * 62
            draw.text((280, ry), lbl, font=FONTS['mono_badge'], fill=(100, 116, 139))
            draw.text((560, ry - 2), val, font=FONTS['mono_med'], fill=col)
            
        # BIG KINETIC IMPACT TEXT
        draw.text((WIDTH // 2, 780), "Failed payments. Lost revenue.", font=FONTS['title_huge'], fill=(255, 255, 255), anchor="mm")
        sub_text = "High-value customer transactions fail silently every day." if is_failed else "Monitoring live merchant payment streams in real time..."
        draw.text((WIDTH // 2, 855), sub_text, font=FONTS['body_large'], fill=(248, 113, 113) if is_failed else (148, 163, 184), anchor="mm")

    # -------------------------------------------------------------------------
    # SCENE 2: MEET REVIVEAI (3.0s – 6.0s)
    # -------------------------------------------------------------------------
    elif t < 6.0:
        rel = t - 3.0
        logo_size = int(220 + min(rel * 14, 30))
        draw_reviveai_logo(draw, WIDTH // 2, HEIGHT // 2 - 120, logo_size)
        
        draw.text((WIDTH // 2, HEIGHT // 2 + 75), "Meet ReviveAI", font=FONTS['title_huge'], fill=(255, 255, 255), anchor="mm")
        draw.text((WIDTH // 2, HEIGHT // 2 + 155), "Meet ReviveAI — Intelligent Payment Recovery", font=FONTS['title_med'], fill=(56, 189, 248), anchor="mm")
        
        # Pill
        draw_round_rect(draw, [WIDTH // 2 - 280, HEIGHT // 2 + 205, WIDTH // 2 + 280, HEIGHT // 2 + 250], radius=22, fill=(13, 20, 36), outline=(16, 185, 129), width=2)
        draw.text((WIDTH // 2, HEIGHT // 2 + 227), "AUTONOMOUS AI AGENT  •  DETERMINISTIC SAFETY GUARDRAILS", font=FONTS['mono_badge'], fill=(16, 185, 129), anchor="mm")

    # -------------------------------------------------------------------------
    # SCENE 3: KEY FEATURES (6.0s – 11.0s)
    # -------------------------------------------------------------------------
    elif t < 11.0:
        rel = t - 6.0
        draw.text((120, 95), "// 6-STAGE AUTONOMOUS AGENTIC INTELLIGENCE ENGINE", font=FONTS['mono_badge'], fill=(16, 185, 129))
        
        stages = ['DETECT', 'UNDERSTAND', 'DECIDE', 'ACT', 'VERIFY', 'LEARN']
        active_idx = min(int(rel * 1.3), 5)
        step_w = (WIDTH - 240) // 6
        
        for i, stg in enumerate(stages):
            sx0 = 120 + i * step_w
            is_active = i <= active_idx
            is_curr = i == active_idx
            
            fill_c = (20, 48, 68) if is_curr else ((15, 38, 32) if is_active else (13, 20, 36))
            out_c = (56, 189, 248) if is_curr else ((16, 185, 129) if is_active else (45, 58, 78))
            draw_round_rect(draw, [sx0 + 5, 120, sx0 + step_w - 5, 160], radius=8, fill=fill_c, outline=out_c, width=2 if is_curr else 1)
            draw.text((sx0 + 16, 134), f"{i+1}. {stg}", font=FONTS['mono_small'], fill=out_c)
            
        # Left Panel 1: Failure Diagnosis (y: 185 to 520)
        draw_round_rect(draw, [120, 185, 960, 530], radius=16, fill=(13, 20, 36), outline=(56, 189, 248), width=2)
        draw.text((150, 215), "01 // AI-POWERED FAILURE DIAGNOSIS", font=FONTS['mono_badge'], fill=(56, 189, 248))
        draw.text((150, 245), "Root Cause Signature Detected", font=FONTS['title_card'], fill=(255, 255, 255))
        
        diag_rows = [
            ("Failure Signature", "PSP_NETWORK_TIMEOUT (Transitory Bank Surge)"),
            ("Customer Trust Profile", "Rahul Sharma  •  16 Past Settled (High Reliability)"),
            ("Historical Cohort Yield", "78% Recovery Rate within 14-Minute Window"),
            ("AI Decision Confidence", "94.8% High Certainty Score")
        ]
        for di, (k, v) in enumerate(diag_rows):
            dy = 295 + di * 48
            draw.text((150, dy), k, font=FONTS['mono_badge'], fill=(100, 116, 139))
            draw.text((370, dy - 2), v, font=FONTS['mono_small'], fill=(16, 185, 129) if di == 3 else (226, 232, 240))
            
        # Left Panel 2: Intelligent Recovery Strategy (y: 555 to 900)
        draw_round_rect(draw, [120, 555, 960, 900], radius=16, fill=(13, 20, 36), outline=(16, 185, 129), width=2)
        draw.text((150, 585), "02 // INTELLIGENT RECOVERY STRATEGIES", font=FONTS['mono_badge'], fill=(16, 185, 129))
        draw.text((150, 615), "Optimal Action: DELAYED_RETRY (14m Delay)", font=FONTS['title_card'], fill=(255, 255, 255))
        
        draw_round_rect(draw, [150, 660, 520, 715], radius=10, fill=(35, 15, 20), outline=(239, 68, 68), width=1)
        draw.text((170, 680), "✖ Immediate Retry: 12% Expected Yield", font=FONTS['mono_small'], fill=(248, 113, 113))
        
        draw_round_rect(draw, [540, 660, 930, 715], radius=10, fill=(15, 45, 30), outline=(16, 185, 129), width=2)
        draw.text((560, 680), "✔ Delayed Retry: 89% Optimal Recovery", font=FONTS['mono_small'], fill=(52, 211, 153))
        
        draw.text((150, 750), "• Smart PayLink prepared as instant customer SMS/WhatsApp fallback.", font=FONTS['body_med'], fill=(148, 163, 184))
        draw.text((150, 790), "• Idempotent state locked to prevent double settlement.", font=FONTS['body_med'], fill=(148, 163, 184))
        draw.text((150, 830), "• AI transaction insights streamed directly to merchant ledger.", font=FONTS['body_med'], fill=(148, 163, 184))
        
        # Right Panel: Explainable AI Decision Reasoning (y: 185 to 900)
        rx = 990
        draw_round_rect(draw, [rx, 185, WIDTH - 120, 900], radius=16, fill=(13, 20, 36), outline=(129, 140, 248), width=2)
        draw.text((rx + 30, 215), "03 // EXPLAINABLE AI DECISION TRACE", font=FONTS['mono_badge'], fill=(129, 140, 248))
        draw.text((rx + 30, 245), "Mathematical Reasoning Audit", font=FONTS['title_card'], fill=(255, 255, 255))
        draw.text((rx + 30, 285), "Transparent evidence weighting for payment #TXN-984210", font=FONTS['body_small'], fill=(148, 163, 184))
        
        conf_ratio = min(rel / 2.0, 1.0) * 0.948
        meter_w = WIDTH - 120 - rx - 60
        draw_round_rect(draw, [rx + 30, 320, rx + 30 + meter_w, 350], radius=15, fill=(30, 41, 59))
        draw_round_rect(draw, [rx + 30, 320, rx + 30 + int(meter_w * conf_ratio), 350], radius=15, fill=(16, 185, 129))
        draw.text((rx + 45, 329), f"AI CERTAINTY: {(conf_ratio * 100):.1f}% HIGH CERTAINTY", font=FONTS['mono_badge'], fill=(255, 255, 255))
        
        fcards = [
            ("CUSTOMER LIFETIME VALUE", "₹2,40,000 INR  •  16 Past Settled Transactions"),
            ("PSP TELEMETRY SIGNATURE", "HDFC PSP queue clearing; 98.4% success post 12m"),
            ("EXPLAINABLE STRATEGY", "DELAYED_RETRY chosen over PayLink to minimize friction"),
            ("GOVERNANCE AUDIT LOG", "Logged to immutable SHA-256 financial event ledger")
        ]
        for fci, (fk, fv) in enumerate(fcards):
            fcy = 380 + fci * 105
            draw_round_rect(draw, [rx + 30, fcy, rx + 30 + meter_w, fcy + 85], radius=10, fill=(20, 28, 48), outline=(51, 65, 85), width=1)
            draw.text((rx + 45, fcy + 18), fk, font=FONTS['mono_badge'], fill=(100, 116, 139))
            draw.text((rx + 45, fcy + 45), fv, font=FONTS['body_small'], fill=(241, 245, 249))

    # -------------------------------------------------------------------------
    # SCENE 4: SMART & SAFE (11.0s – 15.0s)
    # -------------------------------------------------------------------------
    elif t < 15.0:
        rel = t - 11.0
        
        # Security Header
        draw.text((WIDTH // 2, 120), "DETERMINISTIC FINANCIAL SAFETY  •  BOUNDED AUTONOMY", font=FONTS['mono_badge'], fill=(16, 185, 129), anchor="mm")
        draw.text((WIDTH // 2, 175), "Smart & Safe: Financial Safety Guardrails", font=FONTS['title_big'], fill=(255, 255, 255), anchor="mm")
        draw.text((WIDTH // 2, 225), "Zero hallucinations. Bounded financial guardrails enforce mathematical compliance.", font=FONTS['body_med'], fill=(148, 163, 184), anchor="mm")
        
        guardrails = [
            ("01", "Configurable Retry Limits", "STRICT CAP ≤ 2 ATTEMPTS", "Protects customer trust and prevents aggressive gateway spamming.", (56, 189, 248)),
            ("02", "Human Approval Safeguards", "THRESHOLD ≥ ₹50,000 INR", "High-value transactions escalate to operator review in /approvals queue.", (245, 158, 11)),
            ("03", "24-Hour Recovery Windows", "MAX BOUND 24 HOURS", "Restricts recovery actions within standard banking settlement windows.", (129, 140, 248)),
            ("04", "Automatic Termination", "INSTANT ON SETTLEMENT", "Terminates workflows immediately upon payment success to eliminate double charges.", (16, 185, 129))
        ]
        
        card_w = (WIDTH - 240 - 40) // 2
        card_h = 240
        
        for gi, (gnum, gtitle, grule, gdesc, gaccent) in enumerate(guardrails):
            col = gi % 2
            row = gi // 2
            gx = 120 + col * (card_w + 40)
            gy = 275 + row * (card_h + 30)
            
            draw_round_rect(draw, [gx, gy, gx + card_w, gy + card_h], radius=16, fill=(13, 20, 36), outline=gaccent, width=2)
            draw.text((gx + 25, gy + 25), f"GUARDRAIL RULE {gnum}", font=FONTS['mono_badge'], fill=gaccent)
            draw.text((gx + 25, gy + 55), gtitle, font=FONTS['title_card'], fill=(255, 255, 255))
            
            draw_round_rect(draw, [gx + 25, gy + 100, gx + card_w - 25, gy + 145], radius=10, fill=(20, 28, 48), outline=(51, 65, 85), width=1)
            draw.text((gx + 40, gy + 115), grule, font=FONTS['mono_med'], fill=gaccent)
            
            draw.text((gx + 25, gy + 175), gdesc, font=FONTS['body_med'], fill=(148, 163, 184))
            
        draw.text((WIDTH // 2, 860), "ALL WORKFLOW ACTIONS GOVERNED BY RIGID FINANCIAL RECOVERY CONTRACT", font=FONTS['mono_badge'], fill=(16, 185, 129), anchor="mm")

    # -------------------------------------------------------------------------
    # SCENE 5: THE IMPACT & LOGO OUTRO (15.0s – 18.5s)
    # -------------------------------------------------------------------------
    else:
        rel = t - 15.0
        if rel < 1.6:
            # Phase 1: Recovered Payment Card & Revenue Surging
            draw_ambient_glow(draw, WIDTH // 2, 420, 520, (16, 185, 129), steps=6)
            draw_round_rect(draw, [280, 115, WIDTH - 280, 715], radius=20, fill=(8, 28, 20), outline=(16, 185, 129), width=3)
            
            # Settled Badge
            draw_round_rect(draw, [320, 155, 580, 205], radius=25, fill=(16, 65, 42), outline=(16, 185, 129), width=2)
            draw.text((345, 172), "✔ PAYMENT RECOVERED", font=FONTS['mono_med'], fill=(52, 211, 153))
            
            # Generous spacing
            draw.text((320, 245), "₹42,500.00 SETTLED", font=FONTS['title_big'], fill=(255, 255, 255))
            draw.text((320, 315), "Bank UTR: REV-982410294  •  Strategy: DELAYED_RETRY  •  Elapsed: 8.4s", font=FONTS['mono_med'], fill=(167, 243, 208))
            
            draw.line([(320, 365), (WIDTH - 320, 365)], fill=(16, 185, 129), width=2)
            
            # Revenue Protected Counter
            draw.text((320, 405), "TOTAL REVENUE PROTECTED BY REVIVEAI THIS CYCLE:", font=FONTS['mono_badge'], fill=(110, 231, 183))
            draw.text((320, 485), "₹18,42,000", font=FONTS['mono_huge'], fill=(16, 185, 129))
            draw.text((320, 570), "+34.2% Autonomous Recovery Yield  •  Zero Customer Churn", font=FONTS['body_large'], fill=(248, 250, 252))
            
            draw.text((WIDTH // 2, 800), "From Failed Payments to Recovered Revenue.", font=FONTS['title_big'], fill=(255, 255, 255), anchor="mm")
            
        else:
            # Phase 2: GRAND BRAND REVEAL & TAGLINE
            outro_rel = rel - 1.6
            logo_sz = int(220 + min(outro_rel * 12, 25))
            draw_reviveai_logo(draw, WIDTH // 2, HEIGHT // 2 - 120, logo_sz)
            
            draw.text((WIDTH // 2, HEIGHT // 2 + 75), "ReviveAI", font=FONTS['title_huge'], fill=(255, 255, 255), anchor="mm")
            # Exact required tagline: "Recover More. Lose Less. Powered by AI."
            draw.text((WIDTH // 2, HEIGHT // 2 + 155), "Recover More. Lose Less. Powered by AI.", font=FONTS['title_med'], fill=(16, 185, 129), anchor="mm")
            draw.text((WIDTH // 2, HEIGHT // 2 + 215), "Autonomous AI Payment Failure Detection & Recovery", font=FONTS['body_med'], fill=(148, 163, 184), anchor="mm")
            draw.text((WIDTH // 2, HEIGHT // 2 + 260), "reviveai-zeta.vercel.app", font=FONTS['mono_badge'], fill=(56, 189, 248), anchor="mm")

    # Save frame
    out_path = os.path.join(FRAMES_DIR, f"frame_{frame_idx:05d}.png")
    img.save(out_path, format="PNG")
    return frame_idx

if __name__ == '__main__':
    t_start = time.time()
    cores = min(cpu_count(), 16)
    print(f"Rendering {TOTAL_FRAMES} frames across {cores} CPU cores...")
    
    with Pool(cores) as pool:
        for idx in pool.imap_unordered(render_frame_to_image, range(TOTAL_FRAMES), chunksize=4):
            if idx % 100 == 0 or idx == TOTAL_FRAMES - 1:
                print(f"Rendered frame {idx}/{TOTAL_FRAMES} ({(idx/TOTAL_FRAMES)*100:.1f}%)")
                
    elapsed = time.time() - t_start
    print(f"All {TOTAL_FRAMES} frames rendered in {elapsed:.2f} seconds!")
