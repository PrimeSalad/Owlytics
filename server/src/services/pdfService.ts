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
  reports: { title: string; content: string; author: string; attachments: Attachment[]; objective?: string; duration?: string; remarks?: string }[];
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

export async function generateSingleReportPDF(report: any, event?: any): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', (b) => buffers.push(b));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const W = doc.page.width - 100;
      doc.font('Helvetica-Bold').fontSize(16).text(report.title, { width: W, align: 'center' });
      doc.moveDown(0.5);

      if (event) {
        doc.font('Helvetica').fontSize(10).text(`Event: ${event.title}`, { width: W, align: 'center' });
        doc.moveDown(1);
      }

      doc.font('Helvetica-Bold').fontSize(12).text('Report Details');
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10).text(report.content, { width: W, align: 'justify' });
      doc.moveDown(1.5);

      doc.font('Helvetica-Bold').fontSize(10).text(`Prepared by: ${report.profiles?.first_name} ${report.profiles?.last_name}`);
      doc.font('Helvetica').fontSize(10).text(`Date: ${new Date(report.created_at).toLocaleDateString()}`);
      doc.moveDown(1.5);

      const images = [...(report.report_attachments || [])]
        .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .filter((a: any) => a.url);

      if (images.length > 0) {
        doc.font('Helvetica-Bold').fontSize(12).text('Attachments');
        doc.moveDown(0.5);
        const colW = (W - 16) / 2;
        let x = 50;
        let y = doc.y;

        for (let i = 0; i < images.length; i++) {
          const isRight = i % 2 !== 0;
          x = isRight ? 50 + colW + 16 : 50;
          if (!isRight && i > 0) { y += 160; doc.y = y; }
          
          if (y + 150 > doc.page.height - 50) {
            doc.addPage();
            y = 50;
            x = isRight ? 50 + colW + 16 : 50;
          }

          try {
            const buf = await fetchImageBuffer(images[i].url);
            doc.image(buf, x, y, { fit: [colW, 120], align: 'center', valign: 'center' });
            if (images[i].caption) {
              doc.font('Helvetica').fontSize(8).text(images[i].caption, x, y + 125, { width: colW, align: 'center' });
            }
          } catch (err) {
            doc.font('Helvetica-Oblique').fontSize(8).text('[Image unavailable]', x, y + 50, { width: colW, align: 'center' });
          }
        }
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export async function generateAccomplishmentPDF(opts: CompileOptions): Promise<Buffer> {
  // Pre-fetch all images
  type FetchedReport = (typeof opts.activities[0]['reports'][0]) & {
    fetchedImages: { buf: Buffer; caption?: string }[];
  };
  const sections = await Promise.all(
    opts.activities.map(async (act) => ({
      ...act,
      reports: await Promise.all(act.reports.map(async (r) => {
        const sorted = [...r.attachments].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        const fetchedImages = (await Promise.all(sorted.map(async (att) => {
          if (!att.url) return null;
          try { return { buf: await fetchImageBuffer(att.url), caption: att.caption }; }
          catch { return null; }
        }))).filter(Boolean) as { buf: Buffer; caption?: string }[];
        return { ...r, fetchedImages } as FetchedReport;
      })),
    }))
  );

  return new Promise((resolve, reject) => {
    // Legal size (8.5 x 13 inches) to match Word template
    const doc = new PDFDocument({ size: [612, 936], margin: 72, autoFirstPage: true });
    const pass = new PassThrough();
    const chunks: Buffer[] = [];
    pass.on('data', (c) => chunks.push(c));
    pass.on('end', () => resolve(Buffer.concat(chunks)));
    pass.on('error', reject);
    doc.pipe(pass);

    const L = 72;  // left margin
    const W = 612 - 144; // usable width (8.5in - 2in margins)
    const ay = opts.academicYear ?? '2026 – 2027';
    const presidentName = (opts.presidentName ?? '').toUpperCase();
    const secretaryName = (opts.secretaryName ?? '').toUpperCase();
    const ORG = 'College of Information and Computing Sciences Student Organization (CICSSO) of Marinduque State University';

    // ── COVER PAGE ────────────────────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(12)
       .text(ORG, L, 144, { width: W, align: 'center' });

    doc.moveDown(6);
    doc.font('Helvetica-Bold').fontSize(28)
       .text('ACCOMPLISHMENT REPORT', { width: W, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(28)
       .text(`A.Y. ${ay}`, { width: W, align: 'center' });

    doc.moveDown(7);
    doc.font('Helvetica').fontSize(12)
       .text('Submitted Under Administration of', { width: W, align: 'center' });
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(12)
       .text(presidentName, { width: W, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(12)
       .text(`President, CICSSO ${ay}`, { width: W, align: 'center' });

    doc.moveDown(2);
    doc.font('Helvetica').fontSize(12)
       .text('Submitted to:', { width: W, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(12)
       .text('OFFICE OF THE STUDENT AFFAIRS AND SERVICES', { width: W, align: 'center' });

    if (!opts.isFinal) {
      doc.save();
      doc.rotate(-45, { origin: [306, 468] });
      doc.fillColor('#CCCCCC').opacity(0.25).font('Helvetica-Bold').fontSize(90)
         .text('DRAFT', 0, 420, { width: 612, align: 'center' });
      doc.restore();
      doc.opacity(1).fillColor('black');
    }

    // ── PAGE 2: ACCOMPLISHMENT REPORT HEADER + SUMMARY TABLE + DOCUMENTATION ─
    doc.addPage();

    doc.font('Helvetica-Bold').fontSize(12)
       .text('ACCOMPLISHMENT REPORT', L, 72, { width: W, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(12)
       .text(`A.Y ${ay}`, { width: W, align: 'center' });
    doc.moveDown(1);

    // Summary table (Activities | Objectives | Duration | Remarks)
    const colW = W / 4;
    const GREEN = '#D9F2D0';
    const tableTop = doc.y;
    const headers = ['Activities', 'Objectives', 'Duration', 'Remarks'];

    // Header row
    doc.rect(L, tableTop, W, 20).fill(GREEN);
    doc.fillColor('black').font('Helvetica-Bold').fontSize(10);
    headers.forEach((h, i) => {
      doc.text(h, L + i * colW, tableTop + 5, { width: colW, align: 'center' });
    });

    // Draw header borders
    doc.rect(L, tableTop, W, 20).stroke();
    for (let i = 1; i < 4; i++) {
      doc.moveTo(L + i * colW, tableTop).lineTo(L + i * colW, tableTop + 20).stroke();
    }

    // Data rows
    let ty = tableTop + 20;
    for (const sec of sections) {
      for (const r of sec.reports) {
        const cells = [r.title, (r as any).objective ?? '', (r as any).duration ?? '', (r as any).remarks ?? ''];
        const rowH = Math.max(
          ...cells.map((c) => doc.font('Helvetica').fontSize(10).heightOfString(c || ' ', { width: colW - 8 })),
          18
        );
        if (ty + rowH > doc.page.height - 72) {
          doc.addPage();
          ty = 72;
        }
        doc.rect(L, ty, W, rowH).stroke();
        for (let i = 1; i < 4; i++) {
          doc.moveTo(L + i * colW, ty).lineTo(L + i * colW, ty + rowH).stroke();
        }
        doc.font('Helvetica').fontSize(10).fillColor('black');
        cells.forEach((c, i) => {
          doc.text(c || '', L + i * colW + 4, ty + 4, { width: colW - 8, align: 'center' });
        });
        ty += rowH;
      }
    }

    // Documentation section
    if (ty + 40 > doc.page.height - 72) { doc.addPage(); ty = 72; }
    else { ty += 16; }

    doc.font('Helvetica-Bold').fontSize(12).fillColor('black')
       .text('ACCOMPLISHMENT REPORT DOCUMENTATION', L, ty, { width: W, align: 'center' });
    ty += 24;

    let entryNum = 1;
    for (const sec of sections) {
      for (const r of sec.reports) {
        const dateStr = (r as any).duration ||
          [sec.start_time, sec.end_time].filter(Boolean).join(' – ') ||
          new Date(opts.eventDateRange.start).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });

        if (ty + 40 > doc.page.height - 72) { doc.addPage(); ty = 72; }

        // Numbered heading: bold title + italic date
        doc.font('Helvetica-Bold').fontSize(11).fillColor('black')
           .text(`${entryNum}. ${r.title} - `, L + 18, ty, { continued: true, width: W - 18 });
        doc.font('Helvetica-Oblique').fontSize(11)
           .text(dateStr, { width: W - 18 });
        ty = doc.y + 4;
        ty += 12; // one line space above description
        // Description (italic, justified)
        const descH = doc.font('Helvetica').fontSize(10).heightOfString(r.content, { width: W - 18 });
        if (ty + descH > doc.page.height - 72) { doc.addPage(); ty = 72; }
        doc.font('Helvetica').fontSize(10)
           .text(r.content, L + 18, ty, { width: W - 18, align: 'justify' });
        ty = doc.y + 8;

        // Photos in rows of 4
        const imgs = r.fetchedImages;
        const imgW = (W - 18) / 4 - 4;
        const imgH = imgW * 0.75;

        for (let i = 0; i < imgs.length; i += 4) {
          if (ty + imgH + 20 > doc.page.height - 72) { doc.addPage(); ty = 72; }
          const row = imgs.slice(i, i + 4);
          row.forEach((img, col) => {
            const x = L + 18 + col * (imgW + 4);
            try {
              doc.image(img.buf, x, ty, { width: imgW, height: imgH, cover: [imgW, imgH] });
            } catch {
              doc.rect(x, ty, imgW, imgH).fill('#EEEEEE').stroke();
            }
          });
          ty += imgH + 4;
          // Captions
          row.forEach((img, col) => {
            if (img.caption) {
              const x = L + 18 + col * (imgW + 4);
              doc.font('Helvetica-Oblique').fontSize(7).fillColor('#555555')
                 .text(img.caption, x, ty, { width: imgW, align: 'center' });
            }
          });
          ty = doc.y + 8;
        }

        ty += 4;
        entryNum++;
      }
    }

    // ── SIGNATURE BLOCK ───────────────────────────────────────────────────────
    // Push to near bottom if space allows, else new page
    const sigH = 200;
    if (ty + sigH > doc.page.height - 72) { doc.addPage(); ty = 72; }
    else { ty += 40; }

    doc.font('Helvetica').fontSize(11).fillColor('black')
       .text('Prepared by:', L, ty);
    ty += 28;

    doc.font('Helvetica-Bold').fontSize(11).text(presidentName, L, ty);
    ty += 16;
    doc.font('Helvetica-Oblique').fontSize(11).text('CICSSO President', L, ty);
    ty += 32;

    doc.font('Helvetica-Bold').fontSize(11).text(secretaryName, L, ty);
    ty += 16;
    doc.font('Helvetica-Oblique').fontSize(11).text('CICSSO Secretary', L, ty);
    ty += 32;

    doc.font('Helvetica').fontSize(11).text('Noted by:', L, ty);
    ty += 28;
    doc.font('Helvetica-Bold').fontSize(11).text('MS. DOREENA JOY C. BORJA', L, ty);
    ty += 16;
    doc.font('Helvetica-Oblique').fontSize(11).text('CICSSO Adviser', L, ty);
    ty += 32;

    doc.font('Helvetica').fontSize(11).text('Recommending Approval:', L, ty);
    ty += 28;
    doc.font('Helvetica-Bold').fontSize(11).text('DR. RONJIE MAR L. MALINAO', L, ty);
    ty += 16;
    doc.font('Helvetica-Oblique').fontSize(11).text('Dean, College of Information and Computing Sciences', L, ty);

    doc.end();
  });
}
