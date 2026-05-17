import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import https from 'https';
import http from 'http';

interface Attachment { url: string; caption?: string; sort_order?: number }
interface ActivitySection {
  name: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  reports: { title: string; content: string; author: string; attachments: Attachment[] }[];
}
interface CompileOptions {
  eventTitle: string;
  eventDateRange: { start: string; end: string };
  preparedBy: string;
  presidentName?: string;
  secretaryName?: string;
  academicYear?: string;
  activities: ActivitySection[];
  isFinal: boolean;
  orgName?: string;
}


function fetchImageBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      // Follow redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchImageBuffer(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode} fetching image`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Image fetch timeout')); });
  });
}

export async function generateAccomplishmentPDF(opts: CompileOptions): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 60, autoFirstPage: true });
    const pass = new PassThrough();
    const chunks: Buffer[] = [];
    pass.on('data', (c) => chunks.push(c));
    pass.on('end', () => resolve(Buffer.concat(chunks)));
    pass.on('error', reject);
    doc.pipe(pass);

    const W = doc.page.width - 120; // usable width
    const BRAND = '#4F46E5';
    const GRAY  = '#64748B';
    const LIGHT = '#F1F5F9';

    // ── COVER PAGE ────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 180).fill(BRAND);

    doc.fillColor('white')
       .font('Helvetica-Bold').fontSize(11)
       .text((opts.orgName ?? 'Student Organization').toUpperCase(), 60, 60, { width: W, align: 'center' });

    doc.fontSize(26)
       .text('ACCOMPLISHMENT REPORT', 60, 85, { width: W, align: 'center' });

    doc.font('Helvetica').fontSize(12)
       .text(opts.eventTitle, 60, 125, { width: W, align: 'center' });

    const start = new Date(opts.eventDateRange.start).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
    const end   = new Date(opts.eventDateRange.end).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
    doc.fontSize(10).text(`${start} – ${end}`, 60, 148, { width: W, align: 'center' });

    // Meta block
    doc.fillColor('#1E293B').font('Helvetica').fontSize(10)
       .text(`Prepared by: ${opts.preparedBy}`, 60, 210)
       .text(`Date prepared: ${new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}`, 60, 228);

    // DRAFT watermark
    if (!opts.isFinal) {
      doc.save();
      doc.rotate(-45, { origin: [doc.page.width / 2, doc.page.height / 2] });
      doc.fillColor('#E2E8F0').opacity(0.35).font('Helvetica-Bold').fontSize(90)
         .text('DRAFT', 60, doc.page.height / 2 - 45, { width: W + 60, align: 'center' });
      doc.restore();
      doc.opacity(1);
    }

    // ── ACTIVITY SECTIONS ─────────────────────────────────────
    for (const activity of opts.activities) {
      doc.addPage();

      // Section header bar
      doc.rect(60, 60, W, 36).fill(BRAND);
      doc.fillColor('white').font('Helvetica-Bold').fontSize(13)
         .text(activity.name, 72, 71, { width: W - 24 });

      if (activity.start_time || activity.end_time) {
        doc.fillColor(LIGHT).font('Helvetica').fontSize(9)
           .text(
             [activity.start_time, activity.end_time].filter(Boolean).join(' – '),
             72, 71, { width: W - 24, align: 'right' }
           );
      }

      let y = 112;

      for (const report of activity.reports) {
        // Report title
        doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(11)
           .text(report.title, 60, y, { width: W });
        y += 18;

        // Author
        doc.fillColor(GRAY).font('Helvetica').fontSize(9)
           .text(`Submitted by: ${report.author}`, 60, y);
        y += 16;

        // Content
        const contentHeight = doc.fontSize(10).heightOfString(report.content, { width: W });
        if (y + contentHeight > doc.page.height - 80) { doc.addPage(); y = 60; }
        doc.fillColor('#334155').font('Helvetica').fontSize(10)
           .text(report.content, 60, y, { width: W, align: 'justify' });
        y += contentHeight + 16;

        // Photos grid (2 columns)
        const images = [...report.attachments]
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .filter((a) => a.url);

        if (images.length > 0) {
          const colW = (W - 16) / 2;
          const imgH = colW * 0.65;

          for (let i = 0; i < images.length; i += 2) {
            if (y + imgH + 30 > doc.page.height - 80) { doc.addPage(); y = 60; }

            for (let col = 0; col < 2; col++) {
              const img = images[i + col];
              if (!img) continue;
              const x = 60 + col * (colW + 16);
              try {
                const buf = await fetchImageBuffer(img.url);
                doc.image(buf, x, y, { width: colW, height: imgH, cover: [colW, imgH] });
              } catch {
                doc.rect(x, y, colW, imgH).fill(LIGHT);
                doc.fillColor(GRAY).fontSize(8).text('[Image unavailable]', x + 4, y + imgH / 2 - 6, { width: colW - 8, align: 'center' });
              }
              if (img.caption) {
                doc.fillColor(GRAY).font('Helvetica').fontSize(8)
                   .text(img.caption, x, y + imgH + 3, { width: colW, align: 'center' });
              }
            }
            y += imgH + (images[i]?.caption || images[i + 1]?.caption ? 26 : 12);
          }
          y += 8;
        }

        // Divider between reports
        doc.moveTo(60, y).lineTo(60 + W, y).strokeColor('#E2E8F0').lineWidth(1).stroke();
        y += 16;
      }
    }

    // ── SUMMARY PAGE ──────────────────────────────────────────
    doc.addPage();
    doc.rect(60, 60, W, 36).fill(BRAND);
    doc.fillColor('white').font('Helvetica-Bold').fontSize(13)
       .text('SUMMARY', 72, 71, { width: W - 24 });

    let sy = 116;
    const totalReports = opts.activities.reduce((s, a) => s + a.reports.length, 0);
    const totalPhotos  = opts.activities.reduce((s, a) => s + a.reports.reduce((r, rep) => r + rep.attachments.length, 0), 0);

    const summaryRows = [
      ['Total Activities', String(opts.activities.length)],
      ['Total Reports Submitted', String(totalReports)],
      ['Total Photos', String(totalPhotos)],
      ['Event Period', `${start} – ${end}`],
    ];

    for (const [label, value] of summaryRows) {
      doc.fillColor(GRAY).font('Helvetica').fontSize(10).text(label, 60, sy, { width: W / 2 });
      doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(10).text(value, 60 + W / 2, sy);
      sy += 22;
    }

    // Signature block
    sy += 40;
    doc.moveTo(60, sy).lineTo(220, sy).strokeColor('#1E293B').lineWidth(0.5).stroke();
    doc.moveTo(W - 100, sy).lineTo(W + 60, sy).stroke();
    
    doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(9)
       .text(opts.presidentName ?? '', 60, sy - 12, { width: 160, align: 'center' })
       .text(opts.secretaryName ?? '', W - 100, sy - 12, { width: 160, align: 'center' });

    doc.font('Helvetica').fontSize(9)
       .text('President', 60, sy + 6, { width: 160, align: 'center' })
       .text('Secretary', W - 100, sy + 6, { width: 160, align: 'center' });

    doc.end();

  });
}
