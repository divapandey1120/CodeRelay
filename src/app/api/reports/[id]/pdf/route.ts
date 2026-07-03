import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PDFDocument from 'pdfkit';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'INTERVIEWER') {
      return NextResponse.json({ error: 'Unauthorized. Reports are interviewer-only.' }, { status: 401 });
    }

    const { id } = await params;

    const report = await prisma.sessionReport.findUnique({
      where: { sessionId: id },
      include: {
        session: {
          include: {
            interviewer: { select: { name: true, email: true } },
            candidate: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
    }

    if (report.session.interviewerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden. You do not own this report.' }, { status: 403 });
    }

    const payload = report.payload as any;

    // 1. Create a PDF Document instance
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Collect buffer chunks
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    
    const pdfBufferPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    // 2. Build PDF Layout and Content
    
    // Header Branding Banner
    doc.fillColor('#1B2A4A').rect(0, 0, 595.28, 80).fill(); // Navy header
    doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('CodeRelay Interview Report', 50, 28);
    
    // Position pointer down below the navbar
    doc.y = 110;
    doc.fillColor('#0f172a'); // default dark slate text

    // Metadata section
    doc.fontSize(14).font('Helvetica-Bold').text('Session Summary');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    
    const labelX = 50;
    const valueX = 160;
    
    const drawMetaRow = (label: string, value: string) => {
      doc.font('Helvetica-Bold').text(label, labelX);
      doc.font('Helvetica').text(value, valueX, doc.y - 12);
      doc.moveDown(0.2);
    };

    drawMetaRow('Title:', payload.sessionTitle);
    drawMetaRow('Candidate:', report.session.candidate?.name || 'Assigned Candidate');
    drawMetaRow('Interviewer:', report.session.interviewer.name);
    drawMetaRow('Language:', payload.language.toUpperCase());
    drawMetaRow('Started At:', payload.startedAt ? new Date(payload.startedAt).toLocaleString() : 'N/A');
    drawMetaRow('Ended At:', payload.endedAt ? new Date(payload.endedAt).toLocaleString() : 'N/A');
    
    doc.moveDown(1.5);
    
    // Divider line
    doc.strokeColor('#C9D2DC').lineWidth(1).moveTo(50, doc.y).lineTo(545.28, doc.y).stroke();
    doc.moveDown(1.5);

    // Score Table Section
    doc.fontSize(14).font('Helvetica-Bold').text('Evaluation Scores');
    doc.moveDown(0.5);

    const drawScoreRow = (label: string, score: number) => {
      doc.font('Helvetica-Bold').text(label, 70);
      doc.font('Helvetica').text(`${score}/10`, 350, doc.y - 12);
      
      // Draw a mini progress bar
      const barWidth = 100;
      const barFilled = (score / 10) * barWidth;
      doc.fillColor('#F2F5F8').rect(420, doc.y - 14, barWidth, 10).fill(); // background
      doc.fillColor('#2F6690').rect(420, doc.y - 14, barFilled, 10).fill(); // progress
      doc.fillColor('#0f172a');
      doc.moveDown(0.4);
    };

    drawScoreRow('Problem Solving:', payload.scores.problemSolving);
    drawScoreRow('Code Quality:', payload.scores.codeQuality);
    drawScoreRow('Communication:', payload.scores.communication);
    drawScoreRow('Speed & Efficiency:', payload.scores.speed);
    
    doc.moveDown(0.8);
    doc.fontSize(12).font('Helvetica-Bold').text('Overall Score Average:', 70);
    doc.fillColor('#3E8E7E'); // teal green for overall
    doc.fontSize(16).text(`${payload.scores.overall.toFixed(2)} / 10`, 350, doc.y - 16);
    doc.fillColor('#0f172a');
    
    doc.moveDown(2);
    doc.strokeColor('#C9D2DC').lineWidth(1).moveTo(50, doc.y).lineTo(545.28, doc.y).stroke();
    doc.moveDown(1.5);

    // Written feedback
    doc.fontSize(14).font('Helvetica-Bold').text('Structured Feedback');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(payload.feedback || 'No written feedback submitted.', {
      width: 495.28,
      align: 'left',
      lineGap: 3,
    });
    
    // Private Notes
    if (payload.privateNotes) {
      doc.moveDown(2);
      doc.fontSize(14).font('Helvetica-Bold').text('Private Notepad observations');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text(payload.privateNotes, {
        width: 495.28,
        align: 'left',
        lineGap: 3,
      });
    }

    // Chat History summary
    if (payload.chat && payload.chat.length > 0) {
      doc.moveDown(2);
      doc.fontSize(14).font('Helvetica-Bold').text('Chat History Log');
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica');
      for (const chatMsg of payload.chat) {
        doc.font('Helvetica-Bold').text(`${chatMsg.sender} (${chatMsg.role.toLowerCase()}): `);
        doc.font('Helvetica').text(chatMsg.message, 180, doc.y - 11, { width: 360 });
        doc.moveDown(0.2);
      }
    }

    // Final Code on a separate page
    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').text('Final Code Submission');
    doc.moveDown(0.5);
    doc.font('Courier').fontSize(8.5).text(payload.finalCode, {
      width: 495.28,
      align: 'left',
      lineGap: 2.5,
    });

    // Close / Compile the PDF
    doc.end();

    const pdfBuffer = await pdfBufferPromise;

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="CodeRelay-Report-${id}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating PDF report:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
