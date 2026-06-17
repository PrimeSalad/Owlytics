import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, ImageRun, BorderStyle, ShadingType,
  LevelFormat, convertInchesToTwip, SectionType,
} from 'docx';
import https from 'https';
import http from 'http';

const TNR = 'Times New Roman';

interface Attachment { url: string; caption?: string; sort_order?: number }
interface ReportEntry {
  title: string;
  content: string;
  author: string;
  attachments: Attachment[];
  objective?: string;
  duration?: string;
  remarks?: string;
}
interface ActivitySection {
  name: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  reports: ReportEntry[];
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
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchBuf(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode && res.statusCode >= 400) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// ── paragraph helpers matching template exactly ───────────────────────────────

function p(runs: TextRun[], align?: string): Paragraph {
  return new Paragraph({
    alignment: (align as any) ?? AlignmentType.LEFT,
    children: runs,
  });
}

function empty(align: string = AlignmentType.LEFT): Paragraph {
  return new Paragraph({ alignment: align as any, children: [] });
}

function run(text: string, opts: { bold?: boolean; italic?: boolean; size?: number } = {}): TextRun {
  return new TextRun({ text, font: TNR, bold: opts.bold, italics: opts.italic, size: opts.size ? opts.size * 2 : undefined });
}

// ── summary table ─────────────────────────────────────────────────────────────

const GREEN = 'D9F2D0';

function headerCell(text: string): TableCell {
  return new TableCell({
    width: { size: 25, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: GREEN },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [run(text, { bold: true })] })],
  });
}

function dataCell(text: string): TableCell {
  return new TableCell({
    width: { size: 25, type: WidthType.PERCENTAGE },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [run(text)] })],
  });
}

// ── photo paragraph (4 images in one centered paragraph) ─────────────────────

function photosPara(images: { buf: Buffer; caption?: string }[]): Paragraph {
  const children: (ImageRun | TextRun)[] = [];
  images.slice(0, 4).forEach((img, i) => {
    if (i > 0) children.push(new TextRun({ text: '  ' }));
    children.push(new ImageRun({
      data: img.buf,
      transformation: { width: 120, height: 90 },
      type: 'jpg',
    }));
  });
  return new Paragraph({ alignment: AlignmentType.CENTER, children });
}

// ── main export ───────────────────────────────────────────────────────────────

export async function generateAccomplishmentWord(opts: CompileOptions): Promise<Buffer> {
  const ay = opts.academicYear ?? '2026 \u2013 2027';
  const president = (opts.presidentName ?? '').toUpperCase();
  const secretary = (opts.secretaryName ?? '').toUpperCase();

  // Pre-fetch all images
  type FetchedReport = ReportEntry & { imgs: { buf: Buffer; caption?: string }[] };
  type FetchedSection = Omit<ActivitySection, 'reports'> & { reports: FetchedReport[] };

  const sections: FetchedSection[] = await Promise.all(
    opts.activities.map(async (act) => ({
      ...act,
      reports: await Promise.all(act.reports.map(async (r) => {
        const sorted = [...r.attachments].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        const imgs = (await Promise.all(sorted.map(async (att) => {
          if (!att.url) return null;
          try { return { buf: await fetchBuf(att.url), caption: att.caption }; }
          catch { return null; }
        }))).filter(Boolean) as { buf: Buffer; caption?: string }[];
        return { ...r, imgs };
      })),
    }))
  );

  // Flatten all reports for summary table
  const allReports = sections.flatMap((s) => s.reports);

  // ── COVER PAGE (Section 1) ────────────────────────────────────────────────
  // Matches P0–P25 exactly
  const cover: Paragraph[] = [
    empty(AlignmentType.CENTER),                                                          // P0
    empty(AlignmentType.LEFT),                                                            // P1
    p([run('College of Information and Computing Sciences Student Organization (CICSSO) of Marinduque State University', { bold: true })], AlignmentType.CENTER), // P2
    empty(AlignmentType.CENTER),                                                          // P3
    empty(AlignmentType.CENTER),                                                          // P4
    empty(AlignmentType.CENTER),                                                          // P5
    empty(AlignmentType.CENTER),                                                          // P6
    empty(AlignmentType.CENTER),                                                          // P7
    empty(AlignmentType.CENTER),                                                          // P8
    p([run('ACCOMPLISHMENT REPORT', { bold: true, size: 28 })], AlignmentType.CENTER),   // P9
    p([run(`A.Y. ${ay}`, { bold: true, size: 28 })], AlignmentType.CENTER),              // P10
    !opts.isFinal ? p([run('(DRAFT)', { bold: true, size: 20, italic: true })], AlignmentType.CENTER) : empty(), // Added Draft indicator
    empty(AlignmentType.CENTER),                                                          // P11
    empty(AlignmentType.CENTER),                                                          // P12
    empty(AlignmentType.CENTER),                                                          // P13
    empty(AlignmentType.CENTER),                                                          // P14
    empty(AlignmentType.CENTER),                                                          // P15
    empty(AlignmentType.CENTER),                                                          // P16
    empty(AlignmentType.CENTER),                                                          // P17
    p([run('Submitted Under Administration of')], AlignmentType.CENTER),                 // P18
    empty(AlignmentType.CENTER),                                                          // P19
    p([run(president, { bold: true })], AlignmentType.CENTER),                           // P20
    p([run(`President, CICSSO ${ay}`, { bold: true })], AlignmentType.CENTER),           // P21
    empty(AlignmentType.CENTER),                                                          // P22
    empty(AlignmentType.CENTER),                                                          // P23
    p([run('Submitted to:')], AlignmentType.CENTER),                                     // P24
    p([run('OFFICE OF THE STUDENT AFFAIRS AND SERVICES', { bold: true })], AlignmentType.CENTER), // P25
  ];

  // ── MAIN CONTENT (Section 2) ──────────────────────────────────────────────
  // Matches P26–P80 exactly
  const main: (Paragraph | Table)[] = [];

  // P26–P27: two empty center paragraphs before ACCOMPLISHMENT REPORT header
  main.push(empty(AlignmentType.CENTER));
  main.push(empty(AlignmentType.CENTER));

  // P28–P29: ACCOMPLISHMENT REPORT + A.Y (bold TNR, normal size — no sz override)
  main.push(p([
    run('ACCOMPLISHMENT REPORT', { bold: true }),
    ...(!opts.isFinal ? [run(' (DRAFT)', { bold: true, italic: true })] : []),
  ], AlignmentType.CENTER));
  main.push(p([run(`A.Y ${ay}`, { bold: true })], AlignmentType.CENTER));

  // T30: Summary table
  main.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [headerCell('Activities'), headerCell('Objectives'), headerCell('Duration'), headerCell('Remarks')] }),
      ...allReports.map((r) => new TableRow({
        children: [
          dataCell(r.title),
          dataCell(r.objective ?? ''),
          dataCell(r.duration ?? ''),
          dataCell(r.remarks ?? ''),
        ],
      })),
    ],
  }));

  // P31: empty left
  main.push(empty(AlignmentType.LEFT));

  // P32: ACCOMPLISHMENT REPORT DOCUMENTATION (bold, center)
  main.push(p([run('ACCOMPLISHMENT REPORT DOCUMENTATION', { bold: true })], AlignmentType.CENTER));

  // P33: empty center
  main.push(empty(AlignmentType.CENTER));

  // One entry per report (P34–P38 pattern)
  for (const sec of sections) {
    for (const r of sec.reports) {
      const dateStr = r.duration ||
        [sec.start_time, sec.end_time].filter(Boolean).join(' \u2013 ') ||
        new Date(opts.eventDateRange.start).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });

      // P34: numbered "activity - date" (activity bold, date italic)
      main.push(new Paragraph({
        style: 'ListParagraph',
        numbering: { reference: 'doc-numbering', level: 0 },
        children: [
          new TextRun({ text: r.title, bold: true }),
          new TextRun({ text: ' - ', bold: true }),
          new TextRun({ text: dateStr, italics: true }),
        ],
      }));

      // P35: empty ListParagraph (between heading and description)
      main.push(new Paragraph({ style: 'ListParagraph', children: [] }));

      // P36: description — ListParagraph, justify, plain
      main.push(new Paragraph({
        style: 'ListParagraph',
        alignment: AlignmentType.BOTH,
        children: [new TextRun({ text: r.content })],
      }));

      // P37: empty center (between description and photos)
      main.push(empty(AlignmentType.CENTER));

      // P38: photos in rows of 4, each row is one centered paragraph
      for (let i = 0; i < r.imgs.length; i += 4) {
        main.push(photosPara(r.imgs.slice(i, i + 4)));
      }

      // Empty paragraph after photos (P39 equivalent)
      main.push(empty(AlignmentType.LEFT));
    }
  }

  // Signature block — matches P40–P80 (many empty lines then signatures)
  for (let i = 0; i < 20; i++) main.push(empty(AlignmentType.LEFT));

  main.push(p([run('Prepared by:')], AlignmentType.LEFT));                    // P60
  main.push(p([run(' ')], AlignmentType.LEFT));                               // P61
  main.push(p([run(president, { bold: true })], AlignmentType.LEFT));         // P62
  main.push(p([run('CICSSO President', { italic: true })], AlignmentType.LEFT)); // P63
  main.push(p([run(' ', { italic: true })], AlignmentType.LEFT));             // P64
  main.push(p([run(' ', { italic: true })], AlignmentType.LEFT));             // P65
  main.push(p([run(secretary, { bold: true })], AlignmentType.LEFT));         // P66
  main.push(p([run('CICSSO Secretary', { italic: true })], AlignmentType.LEFT)); // P67
  main.push(p([run(' ', { italic: true })], AlignmentType.LEFT));             // P68
  main.push(p([run(' ')], AlignmentType.LEFT));                               // P69
  main.push(p([run('Noted by:')], AlignmentType.LEFT));                       // P70
  main.push(p([run(' ')], AlignmentType.LEFT));                               // P71
  main.push(p([run('MS. DOREENA JOY C. BORJA', { bold: true })], AlignmentType.LEFT)); // P72
  main.push(p([run('CICSSO Adviser', { italic: true })], AlignmentType.LEFT)); // P73
  main.push(p([run(' ', { italic: true })], AlignmentType.LEFT));             // P74
  main.push(p([run(' ', { italic: true })], AlignmentType.LEFT));             // P75
  main.push(p([run(' ')], AlignmentType.LEFT));                               // P76
  main.push(p([run('Recommending Approval: ')], AlignmentType.LEFT));         // P77
  main.push(p([run(' ')], AlignmentType.LEFT));                               // P78
  main.push(p([run('DR. RONJIE MAR L. MALINAO ', { bold: true })], AlignmentType.LEFT)); // P79
  main.push(p([run('Dean, College of Information and Computing Sciences', { italic: true })], AlignmentType.LEFT)); // P80

  const pageProps = {
    size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(13) },
    margin: { top: convertInchesToTwip(1), right: convertInchesToTwip(1), bottom: convertInchesToTwip(2.12), left: convertInchesToTwip(1) },
  };

  const doc = new Document({
    numbering: {
      config: [{
        reference: 'doc-numbering',
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT }],
      }],
    },
    sections: [
      { properties: { page: pageProps }, children: cover },
      { properties: { type: SectionType.NEXT_PAGE, page: pageProps }, children: main },
    ],
  });

  return Packer.toBuffer(doc);
}
