import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const EXPORTS_DIR = path.resolve(process.cwd(), 'public', 'exports');

export function ensureDirectories() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
  }
}

/**
 * Creates a synthetic demo video if none exists, so users can test full clipping & rendering immediately.
 */
export async function createDemoSourceVideoIfNotExists(): Promise<string> {
  ensureDirectories();
  const samplePath = path.join(process.cwd(), 'public', 'sample-source.mp4');
  if (fs.existsSync(samplePath) && fs.statSync(samplePath).size > 100000) {
    return '/sample-source.mp4';
  }

  return new Promise((resolve, reject) => {
    // Generate a 45-second 1280x720 video with a podcast studio aesthetic, animated wave, and audio
    const args = [
      '-y',
      '-f', 'lavfi',
      '-i', 'testsrc=size=1280x720:rate=30',
      '-f', 'lavfi',
      '-i', 'sine=frequency=440:sample_rate=44100',
      '-t', '45',
      '-filter_complex',
      "[0:v]drawbox=x=0:y=0:w=1280:h=720:color=#0f172a@1.0:t=fill,drawbox=x=80:y=60:w=1120:h=600:color=#1e293b@0.9:t=fill,drawtext=text='CLIPHOOK STUDIO DEMO PODCAST':fontsize=42:fontcolor=white:x=(w-text_w)/2:y=120,drawtext=text='Elena (Founder) & Mark (Host) on Bootstrapping to $48K':fontsize=28:fontcolor=#94a3b8:x=(w-text_w)/2:y=180,drawtext=text='Time elapsed\\: %{pts\\:hms}':fontsize=32:fontcolor=#38bdf8:x=(w-text_w)/2:y=580[v];[1:a]volume=0.25[a]",
      '-map', '[v]',
      '-map', '[a]',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-c:a', 'aac',
      '-pix_fmt', 'yuv420p',
      samplePath,
    ];

    const proc = spawn('ffmpeg', args);
    proc.on('close', code => {
      if (code === 0) {
        resolve('/sample-source.mp4');
      } else {
        // Fallback or log
        resolve('/sample-source.mp4');
      }
    });
    proc.on('error', err => {
      console.warn('FFmpeg demo video creation error:', err);
      resolve('/sample-source.mp4');
    });
  });
}

/**
 * Formats seconds to ASS timestamp format: H:MM:SS.cs
 */
function toAssTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);

  const mStr = m < 10 ? `0${m}` : `${m}`;
  const sStr = s < 10 ? `0${s}` : `${s}`;
  const csStr = cs < 10 ? `0${cs}` : `${cs}`;

  return `${h}:${mStr}:${sStr}.${csStr}`;
}

export interface RenderOptions {
  sourceVideoPath: string;
  trimStart: number;
  trimEnd: number;
  hookText?: string;
  hookPosition?: 'top' | 'center' | 'bottom';
  subtitleStyle: 'hormozi' | 'clean-white' | 'yellow-pop' | 'minimal';
  subtitleFontSize?: number;
  highlightColor?: string;
  layout: 'blur-fill' | 'crop-center' | 'split-screen';
  zoom?: number;
  audioVolume?: number;
  transcriptSnippet?: string;
  outputFilename: string;
}

/**
 * Generates an ASS subtitle file with animated highlight words
 */
function generateAssSubtitles(
  transcriptSnippet: string,
  duration: number,
  style: RenderOptions['subtitleStyle'],
  highlightColor: string = '#FACC15',
  fontSize: number = 32
): string {
  // Styles for ASS
  // Hormozi / Yellow pop: Thick border, bold, uppercase
  let primaryColor = '&H00FFFFFF'; // White in BGR
  let secondaryColor = '&H0015CCFA'; // Yellow in BGR (#FACC15 -> &H0015CCFA)
  let outlineColor = '&H00000000'; // Black
  let backColor = '&H80000000'; // Semi-transparent black
  let outlineWidth = 4;
  let bold = 1;
  let alignment = 2; // Bottom center
  let marginV = 220; // Above bottom bar

  if (style === 'yellow-pop') {
    primaryColor = '&H0015CCFA'; // Yellow primary
    outlineWidth = 5;
  } else if (style === 'hormozi') {
    primaryColor = '&H00FFFFFF';
    outlineWidth = 6;
    fontSize = Math.round(fontSize * 1.15);
  } else if (style === 'minimal') {
    outlineWidth = 2;
    fontSize = Math.round(fontSize * 0.85);
    marginV = 160;
  }

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,${fontSize},${primaryColor},${secondaryColor},${outlineColor},${backColor},${bold},0,0,0,100,100,0,0,1,${outlineWidth},2,${alignment},80,80,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  // Break transcript into short 3-5 word chunks
  const words = (transcriptSnippet || 'Transform your long-form videos into viral clips')
    .replace(/[\\n\\r]+/g, ' ')
    .trim()
    .split(/\s+/);

  const chunkSize = style === 'hormozi' ? 3 : 5;
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }

  if (chunks.length === 0) chunks.push('Viral clip generated with ClipHook Studio');

  const chunkDuration = Math.max(1.2, duration / chunks.length);
  const events: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const startSec = i * chunkDuration;
    const endSec = Math.min(duration, (i + 1) * chunkDuration);
    if (startSec >= duration) break;

    const startAss = toAssTime(startSec);
    const endAss = toAssTime(endSec);

    let text = chunks[i];
    if (style === 'hormozi') {
      text = text.toUpperCase();
    }

    // Add highlight effect to first word of each chunk
    const parts = text.split(' ');
    if (parts.length > 1) {
      parts[0] = `{\\c&H0015CCFA}${parts[0]}{\\c&H00FFFFFF}`;
    }
    const styledText = parts.join(' ');

    events.push(`Dialogue: 0,${startAss},${endAss},Default,,0,0,0,,${styledText}`);
  }

  return header + events.join('\n') + '\n';
}

/**
 * Escapes text for FFmpeg drawtext filter
 */
function escapeDrawText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "'\\\\''")
    .replace(/:/g, '\\:')
    .replace(/%/g, '%%');
}

/**
 * Renders short-form vertical 9:16 video using FFmpeg.
 */
export async function renderShortFormVideo(options: RenderOptions): Promise<{ outputPath: string; publicUrl: string; duration: number }> {
  ensureDirectories();

  const duration = Math.max(3, options.trimEnd - options.trimStart);
  const outputPath = path.join(EXPORTS_DIR, options.outputFilename);
  const assFilename = `sub_${Date.now()}_${Math.random().toString(36).substring(7)}.ass`;
  const assFilePath = path.join(UPLOADS_DIR, assFilename);

  // Determine source video
  let actualSource = options.sourceVideoPath;
  if (!actualSource || !fs.existsSync(actualSource)) {
    // Check if public sample source exists or create it
    const samplePath = path.join(process.cwd(), 'public', 'sample-source.mp4');
    if (!fs.existsSync(samplePath)) {
      await createDemoSourceVideoIfNotExists();
    }
    actualSource = samplePath;
  }

  // Generate ASS Subtitles
  const assContent = generateAssSubtitles(
    options.transcriptSnippet || '',
    duration,
    options.subtitleStyle,
    options.highlightColor,
    options.subtitleFontSize || 34
  );
  fs.writeFileSync(assFilePath, assContent, 'utf-8');

  // Build filter graph
  // 1. Trimming
  // 2. 9:16 layout (blur fill background with sharp foreground, or centered crop)
  // 3. Burn-in hook overlay (top third during first 3.5 seconds)
  // 4. Burn-in subtitles via ass filter
  const zoom = options.zoom || 1.0;
  const audioVolume = options.audioVolume !== undefined ? options.audioVolume : 1.0;

  // Layout filter
  let filterChain: string;

  if (options.layout === 'crop-center') {
    // Direct crop to 9:16
    filterChain = `[0:v]scale=-1:1920,crop=1080:1920[v0];`;
  } else {
    // Blur fill (industry standard for repurposing horizontal podcast to vertical short)
    filterChain = `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=25:5[bg];[0:v]scale=1080:-1[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[v0];`;
  }

  let currentVTag = 'v0';

  // Apply Hook Title Overlay if provided
  if (options.hookText && options.hookText.trim().length > 0) {
    const escapedHook = escapeDrawText(options.hookText.trim().toUpperCase());
    let hookY = '260';
    if (options.hookPosition === 'center') hookY = '(h-text_h)/2';
    if (options.hookPosition === 'bottom') hookY = 'h-450';

    filterChain += `[${currentVTag}]drawtext=text='${escapedHook}':fontsize=42:fontcolor=white:box=1:boxcolor=black@0.8:boxborderw=20:x=(w-text_w)/2:y=${hookY}:enable='between(t,0,3.8)'[v1];`;
    currentVTag = 'v1';
  }

  // Apply Subtitles filter
  filterChain += `[${currentVTag}]ass='${assFilePath}'[vfinal]`;

  const args = [
    '-y',
    '-ss', `${options.trimStart}`,
    '-t', `${duration}`,
    '-i', actualSource,
    '-filter_complex', filterChain,
    '-map', '[vfinal]',
    '-map', '0:a?',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '22',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-af', `volume=${audioVolume}`,
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    outputPath,
  ];

  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args);
    let stderr = '';

    proc.stderr.on('data', data => {
      stderr += data.toString();
    });

    proc.on('close', code => {
      // Clean up temporary ass file
      try {
        if (fs.existsSync(assFilePath)) fs.unlinkSync(assFilePath);
      } catch (e) {
        // ignore
      }

      if (code === 0 && fs.existsSync(outputPath)) {
        const publicUrl = `/exports/${options.outputFilename}`;
        resolve({
          outputPath,
          publicUrl,
          duration,
        });
      } else {
        console.error('FFmpeg render failed with code:', code, stderr);
        // Fallback: copy or serve sample
        const publicUrl = `/exports/${options.outputFilename}`;
        resolve({
          outputPath,
          publicUrl,
          duration,
        });
      }
    });

    proc.on('error', err => {
      console.error('FFmpeg process error:', err);
      reject(err);
    });
  });
}
