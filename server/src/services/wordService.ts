import PizZip from 'pizzip';
// @ts-ignore
import Docxtemplater from 'docxtemplater';
// @ts-ignore
import ImageModule from 'docxtemplater-image-module-free';
import { readFileSync } from 'fs';
import { join } from 'path';
import https from 'https';
import http from 'http';

const TEMPLATE_PATH = join(__dirname, '../assets/template.docx');

interface Attachment { url: string; caption?: string; sort_order?: number }
interface ActivitySection {
  name: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  reports: { title: string; content: string; author: string; attachments: Attachment[] }[];
}
export interface CompileOptions {
  eventTitle: string;
  eventDateRange: { start: string; end: string };
  preparedBy: string;
  academicYear?: string;
  presidentName?: string;
  secretaryName?: string;
  orgName?: string;
  activities: ActivitySection[];
  isFinal: boolean;
}

function fetchBuf(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      // Follow redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchBuf(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode} fetching image`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Image fetch timeout')); });
  });
}

export async function generateAccomplishmentWord(opts: CompileOptions): Promise<Buffer> {
  console.log(`[wordService] Starting generation for event: ${opts.eventTitle}`);
  const ay = opts.academicYear || '2026 – 2027';

  const presidentDisplay = (opts.presidentName ?? '').toUpperCase();
  const secretaryDisplay = (opts.secretaryName ?? '').toUpperCase();

  const start = new Date(opts.eventDateRange.start).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
  const end   = new Date(opts.eventDateRange.end).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
  const eventDateStr = `${start} – ${end}`;

  // Pre-fetch ALL images per activity
  const activities = await Promise.all(
    opts.activities.map(async (a) => {
      console.log(`[wordService] Processing activity: ${a.name} with ${a.reports.length} reports`);
      // Collect all attachments across all reports in this activity
      const allAttachments: Attachment[] = [];
      for (const r of a.reports) {
        const sorted = [...r.attachments].sort((x, y) => (x.sort_order ?? 0) - (y.sort_order ?? 0));
        allAttachments.push(...sorted);
      }

      console.log(`[wordService] Activity ${a.name} has ${allAttachments.length} total attachments`);

      const photosData = await Promise.all(
        allAttachments.map(async (att, idx) => {
          if (!att.url) return null;
          try {
            console.log(`[wordService] Fetching image ${idx+1}/${allAttachments.length}: ${att.url}`);
            const buf = await fetchBuf(att.url);
            console.log(`[wordService] Image ${idx+1} fetched, size: ${buf.length} bytes`);
            return { photo: buf };
          } catch (e: any) {
            console.warn(`[wordService] Failed to fetch image ${att.url}: ${e.message}`);
            return null;
          }
        })
      );

      const dateStr = [a.start_time, a.end_time].filter(Boolean).join(' – ') || eventDateStr;
      const narrativeContent = a.reports.map((r) => `${r.title.toUpperCase()}\n${r.content}`).join('\n\n') || '';

      if (!narrativeContent) {
        console.warn(`[wordService] No narrative content for activity: ${a.name}`);
      } else {
        console.log(`[wordService] Narrative length for ${a.name}: ${narrativeContent.length} chars`);
      }

      return {
        'activity title': (a.name ?? '').toUpperCase(),
        objective: (a.description ?? a.reports.map((r) => r.title).join('; ')) || '',
        duration: dateStr,
        event: (a.name ?? opts.eventTitle).toUpperCase(),
        date: dateStr,
        details: narrativeContent,
        photos: photosData.filter((p) => p !== null),
      };
    })
  );

  console.log(`[wordService] Total activities to render: ${activities.length}`);

  const imageModule = new ImageModule({
    centered: false,
    fileType: 'docx',
    getImage(tagValue: Buffer | null) {
      if (!tagValue || !Buffer.isBuffer(tagValue) || tagValue.length === 0) return null;
      return tagValue;
    },
    getSize(_img: Buffer | null) {
      return [520, 360]; // Adjusted size
    },
  });

  const templateBuf = readFileSync(TEMPLATE_PATH);
  console.log(`[wordService] Template loaded, size: ${templateBuf.length} bytes`);
  const zip = new PizZip(templateBuf);
  const doc = new Docxtemplater(zip, {
    modules: [imageModule],
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{', end: '}' },
    nullGetter() { return ''; },
  });

  try {
    doc.render({
      president: presidentDisplay,
      secretary: secretaryDisplay,
      'academic year': ay,
      'org name': (opts.orgName ?? 'STUDENT ORGANIZATION').toUpperCase(),
      'event title': opts.eventTitle.toUpperCase(),
      'prepared by': opts.preparedBy.toUpperCase(),
      'date compiled': new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }),
      activities,
    });
    console.log(`[wordService] Template rendered successfully`);
  } catch (err: any) {
    console.error(`[wordService] Error rendering template:`, err);
    throw err;
  }

  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' }) as Buffer;
}




