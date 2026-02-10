/**
 * Generate and download a PDF for a saved weekly program.
 * Uses dynamic import to avoid constructor issues with jspdf in some bundlers.
 * @param {{ program: Array, level?: string, userName?: string, createdAt?: string, heightCm?: number, weightKg?: number, nutrition?: { tdee?: number, proteinG?: number, note?: string } }} opts
 */
export async function downloadProgramPdf({ program, level = 'intermediate', userName, createdAt, heightCm, weightKg, nutrition }) {
  if (!program || !Array.isArray(program) || program.length === 0) return;

  const jspdfModule = await import('jspdf');
  const JsPDF = jspdfModule.jsPDF ?? jspdfModule.default;
  if (typeof JsPDF !== 'function') throw new Error('PDF library not available');
  const doc = new JsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const checkboxR = 2;

  // --- COVER PAGE ---
  let yPos = 50;

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Your Calisthenics Guide', pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;
  doc.setFontSize(22);
  doc.setTextColor(201, 163, 39);
  doc.text('1-Week Program', pageWidth / 2, yPos, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos += 20;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  const levelStr = (level || 'intermediate').charAt(0).toUpperCase() + (level || '').slice(1);
  doc.text(`Level: ${levelStr}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  if (userName && userName !== 'None') {
    doc.setFontSize(12);
    doc.text(`Created for ${userName}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
  }
  if (heightCm != null || weightKg != null) {
    doc.setFontSize(10);
    const h = heightCm != null && heightCm > 0 ? `${heightCm} cm` : '–';
    const w = weightKg != null && weightKg > 0 ? `${weightKg} kg` : '–';
    doc.text(`Height: ${h}  •  Weight: ${w}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
  }
  if (createdAt) {
    doc.setFontSize(10);
    doc.text(new Date(createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
  }
  yPos += 10;

  if (nutrition && (nutrition.tdee != null || nutrition.proteinG != null)) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Nutrition (estimate)', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    if (nutrition.tdee) doc.text(`~${nutrition.tdee} kcal/day`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    if (nutrition.proteinG) doc.text(`~${nutrition.proteinG}g protein/day`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'italic');
  doc.text('Check off each exercise as you complete it. Stay consistent!', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;
  doc.text('reps-dz.com', pageWidth / 2, yPos, { align: 'center' });
  doc.setFont('helvetica', 'normal');

  doc.addPage();

  if (nutrition?.sampleMeals && nutrition.sampleMeals.length > 0) {
    let mealY = margin;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Sample Daily Meals', margin, mealY);
    mealY += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Example meals with times and quantities:', margin, mealY);
    mealY += 12;
    nutrition.sampleMeals.forEach((meal) => {
      if (mealY > pageHeight - 50) {
        doc.addPage();
        mealY = margin;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`${meal.time} – ${meal.name}  (~${meal.kcal} kcal, ~${meal.protein}g protein)`, margin, mealY);
      mealY += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      (meal.foods || []).forEach((f) => {
        doc.text(`  • ${f.name}: ${f.qty || ''}`, margin, mealY);
        mealY += 6;
      });
      mealY += 6;
    });
    doc.addPage();
  }
  yPos = margin;

  // --- PROGRAM PAGES ---
  const weeks = program.slice(0, 1);
  weeks.forEach((week) => {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Week ${week.week ?? 1}`, margin, yPos);
    yPos += 12;

    (week.days || []).forEach((day) => {
      if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Day ${day.day}: ${day.focus || 'Workout'}`, margin, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      (day.exercises || []).forEach((exercise) => {
        if (yPos > pageHeight - 35) {
          doc.addPage();
          yPos = margin;
        }

        doc.circle(margin + 3, yPos - 1.5, checkboxR, 'S');
        doc.text(exercise.name || '', margin + 12, yPos);
        yPos += 7;

        if (exercise.sets) {
          const setsLines = String(exercise.sets).split('\n').filter(Boolean);
          setsLines.forEach((line) => {
            if (yPos > pageHeight - 35) {
              doc.addPage();
              yPos = margin;
            }
            doc.text(`  ${line}`, margin + 12, yPos);
            yPos += 6;
          });
        }

        if (exercise.rest) {
          doc.setFont('helvetica', 'italic');
          doc.text(`  Rest: ${exercise.rest}`, margin + 12, yPos);
          doc.setFont('helvetica', 'normal');
          yPos += 6;
        }
        yPos += 2;
      });

      yPos += 8;
    });

    yPos += 10;
  });

  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text(`reps-dz.com  •  Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }

  const levelStrFile = (level || 'program').replace(/\s+/g, '-');
  const nameStr = userName && userName !== 'None' ? String(userName).replace(/\s+/g, '-') : 'user';
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `your-program-${levelStrFile}-${nameStr}-${dateStr}.pdf`;
  doc.save(filename);
}
