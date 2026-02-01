import jsPDF from 'jspdf';

/**
 * Generate and download a PDF for a weekly calisthenics program.
 * @param {Object} options
 * @param {Array} options.program - Array of weeks, e.g. [{ week: 1, days: [{ day, focus, exercises }] }]
 * @param {string} options.level - beginner | intermediate | advanced
 * @param {string} [options.userName] - Optional user name for subtitle
 * @param {string} [options.createdAt] - Optional date string for subtitle
 */
export function downloadProgramPdf({ program, level, userName, createdAt }) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Weekly Calisthenics Endurance Program', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  const levelStr = (level || 'intermediate').charAt(0).toUpperCase() + (level || '').slice(1);
  doc.text(`Level: ${levelStr}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  if (userName && userName !== 'None') {
    doc.text(`User: ${userName}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
  }
  if (createdAt) {
    doc.text(`Saved: ${new Date(createdAt).toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
  }
  yPos += 10;

  const weeks = Array.isArray(program) ? program : (program?.program || []);
  const oneWeek = weeks.slice(0, 1);

  oneWeek.forEach((week) => {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Week ${week.week || 1}`, 20, yPos);
    yPos += 10;

    (week.days || []).forEach((day) => {
      if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Day ${day.day}: ${day.focus || ''}`, 25, yPos);
      yPos += 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      (day.exercises || []).forEach((exercise) => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${exercise.name || ''}`, 30, yPos);
        yPos += 6;
        if (exercise.sets) {
          const setsLines = String(exercise.sets).split('\n').filter(Boolean);
          if (setsLines.length > 0) {
            if (yPos > pageHeight - 30) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(`  ${setsLines[0]}`, 35, yPos);
            yPos += 6;
            for (let i = 1; i < setsLines.length; i++) {
              if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = 20;
              }
              doc.text(`  ${setsLines[i]}`, 35, yPos);
              yPos += 6;
            }
          }
        }
        if (exercise.rest) {
          doc.setFont('helvetica', 'italic');
          doc.text(`  Rest between sets: ${exercise.rest}`, 35, yPos);
          doc.setFont('helvetica', 'normal');
          yPos += 6;
        }
      });
      yPos += 5;
    });
    yPos += 10;
  });

  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Created by reps-dz', pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  const filename = `weekly-program-${levelStr}-${userName && userName !== 'None' ? userName.replace(/\s+/g, '-') : 'user'}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
