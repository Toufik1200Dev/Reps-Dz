/**
 * Send 6-week program to user's email via Brevo API.
 * Requires: BREVO_API_KEY, BREVO_SENDER_EMAIL (verified sender in Brevo)
 * Optional: BREVO_SENDER_NAME (default: Toufik Calisthenics)
 */
const { generate6WeekPdfBuffer, generate1WeekPdfBuffer } = require('./programPdfService');

function buildProgramHtml(userName, data, weeksCount, attachmentFilename) {
  const w = weeksCount === 12 ? 12 : 6;
  const weekLabel = w === 12 ? '12-week' : '6-week';
  const testWeek = w === 12 ? 'week 12' : 'week 6';
  const level = (data.level || 'intermediate').charAt(0).toUpperCase() + (data.level || 'intermediate').slice(1);
  const firstName = userName ? userName.split(/\s+/)[0] : '';
  const greeting = firstName ? `Hi ${firstName},` : 'Hello,';
  const nut = data.nutrition || {};
  const hasNutrition = nut.tdee || nut.proteinG;
  const hasPdf = !!attachmentFilename;
  const safeFilename = attachmentFilename ? attachmentFilename.replace(/[<>"&]/g, '') : '';

  const attachmentBlock = hasPdf
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fefce8 0%,#fef9c3 100%);border:2px solid #facc15;border-radius:12px;margin-bottom:28px;">
        <tr><td style="padding:24px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="vertical-align:middle;width:56px;padding-right:20px;">
                <div style="width:56px;height:56px;background:#facc15;border-radius:12px;text-align:center;line-height:56px;font-size:28px;">📎</div>
              </td>
              <td style="vertical-align:middle;">
                <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#1e293b;">Your program PDF is attached</p>
                <p style="margin:0 0 8px;font-size:14px;color:#475569;">Look for the file: <strong style="color:#0f172a;word-break:break-all;">${safeFilename}</strong></p>
                <p style="margin:0;font-size:13px;color:#64748b;">If you don't see it, check your <strong>Spam</strong> or <strong>Promotions</strong> folder and make sure your email client allows attachments.</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>`
    : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:2px solid #f87171;border-radius:12px;margin-bottom:28px;">
        <tr><td style="padding:24px 28px;">
          <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#991b1b;">We couldn't attach your PDF this time</p>
          <p style="margin:0;font-size:14px;color:#7f1d1d;">Please reply to this email or contact us — we'll send your program PDF as soon as possible.</p>
        </td></tr>
      </table>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Your ${weekLabel.replace('week', 'Week')} Calisthenics Program</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f1f5f9;color:#1e293b;line-height:1.6;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;">Your personalized ${weekLabel} calisthenics program is attached to this email. Look for the PDF attachment.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.08),0 4px 10px -5px rgba(0,0,0,0.04);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:44px 40px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:0.15em;text-transform:uppercase;">Toufik Calisthenics</p>
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.03em;">Your Program Is Ready</h1>
              <p style="margin:12px 0 0;font-size:15px;color:#94a3b8;">${weekLabel.replace('week', 'Week')} Training Plan · Level ${level}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 36px;">
              <p style="margin:0 0 24px;font-size:17px;color:#334155;">${greeting}</p>
              <p style="margin:0 0 24px;font-size:16px;color:#334155;">Thank you for choosing your <strong>${weekLabel} calisthenics program</strong>. ${hasPdf ? 'Your personalized plan is attached to this email as a <strong>PDF file</strong> so you can save it, print it, or open it on any device.' : 'Unfortunately we could not attach your PDF right now, but we\'re working on it.'}</p>

              ${attachmentBlock}

              <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#0f172a;">What's inside your program</p>
              <ul style="margin:0 0 24px;padding-left:22px;font-size:15px;color:#475569;line-height:1.7;">
                <li style="margin-bottom:8px;">${w} weeks of structured training (5 sessions per week)</li>
                <li style="margin-bottom:8px;">Exercises, sets, reps, and rest times tailored to your level</li>
                ${hasNutrition ? '<li style="margin-bottom:8px;">Daily calorie and protein targets</li><li style="margin-bottom:8px;">Sample meal ideas and timing</li>' : ''}
                <li style="margin-bottom:8px;">Progressive overload and built-in deload week</li>
                <li>Endurance test in ${testWeek} to track progress</li>
              </ul>

              <p style="margin:0 0 24px;font-size:15px;color:#334155;">${hasPdf ? 'Open the attached PDF to start your plan.' : 'We\'ll send your PDF as soon as our system is back online.'} Train consistently and enjoy the journey.</p>
              <p style="margin:0;font-size:15px;color:#334155;">If you have any questions, reply to this email — I'm here to help.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:28px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:15px;font-weight:600;color:#475569;">Toufik Calisthenics</p>
              <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;">reps-dz.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendProgramEmail(to, userName, programData, options = {}) {
  const { weeksCount = 6 } = options;
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'Toufik Calisthenics';

  if (!apiKey || !senderEmail) {
    throw new Error('Email not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL in environment. Sender must be verified in Brevo dashboard.');
  }

  const nameStr = (userName && String(userName).trim()) ? String(userName).trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '') : 'program';
  const levelStr = (programData.level || 'intermediate').charAt(0).toUpperCase() + (programData.level || 'intermediate').slice(1);
  const dateStr = new Date().toISOString().split('T')[0];
  const weekLabel = weeksCount === 12 ? '12Week' : '6Week';
  const filename = `Your-${weekLabel}-Calisthenics-Program-${levelStr}-${nameStr}-${dateStr}.pdf`;

  let pdfBuffer;
  let pdfFailed = false;
  try {
    pdfBuffer = await generate6WeekPdfBuffer(programData, {
      userName: (userName && String(userName).trim()) || 'user',
      userAge: options.userAge,
      level: programData.level || 'intermediate',
      weeksCount,
      goals: options.goals || []
    });
  } catch (pdfErr) {
    console.error('[Brevo] 6/12-week PDF generation failed (Puppeteer/Chromium may be unavailable):', pdfErr.message);
    pdfFailed = true;
  }

  const hasPdf = !pdfFailed && Buffer.isBuffer(pdfBuffer) && pdfBuffer.length > 0;
  const attachments = hasPdf ? [{ name: filename, content: pdfBuffer.toString('base64') }] : [];
  if (hasPdf) {
    console.log('[Brevo] Attaching PDF:', filename, 'size:', pdfBuffer.length, 'bytes');
  } else {
    console.warn('[Brevo] Sending 6/12-week email without PDF attachment (PDF generation unavailable)');
  }

  const html = buildProgramHtml(userName, programData, weeksCount, hasPdf ? filename : null);

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to, ...(userName && { name: userName }) }],
    subject: weeksCount === 12
      ? (hasPdf ? 'Your 12-Week Calisthenics Program — PDF attached' : 'Your 12-Week Calisthenics Program')
      : (hasPdf ? 'Your 6-Week Calisthenics Program — PDF attached' : 'Your 6-Week Calisthenics Program'),
    htmlContent: html
  };
  if (attachments.length > 0) payload.attachment = attachments;

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey.trim(),
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const errBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg = errBody.message || errBody.code || `Brevo API error: ${response.status}`;
    console.error('[Brevo] Send failed:', JSON.stringify({ status: response.status, body: errBody }));
    throw new Error(msg);
  }

  console.log('[Brevo] Email with PDF sent to', to);
}

/** Build HTML for 1-week free program email. attachmentFilename=null when PDF could not be generated. */
function build1WeekProgramHtml(userName, data, attachmentFilename) {
  const level = (data.level || 'intermediate').charAt(0).toUpperCase() + (data.level || 'intermediate').slice(1);
  const firstName = userName ? userName.split(/\s+/)[0] : '';
  const greeting = firstName ? `Hi ${firstName},` : 'Hello,';
  const hasPdf = !!attachmentFilename;
  const safeFilename = attachmentFilename ? attachmentFilename.replace(/[<>"&]/g, '') : '';

  const attachmentBlock = hasPdf
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fefce8;border:2px solid #facc15;border-radius:12px;margin-bottom:24px;">
        <tr><td style="padding:20px 24px;">
          <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#1e293b;">Your program PDF is attached</p>
          <p style="margin:0 0 8px;font-size:14px;color:#475569;">Look for: <strong style="color:#0f172a;word-break:break-all;">${safeFilename}</strong></p>
          <p style="margin:0;font-size:13px;color:#64748b;">Can't see it? Check <strong>Spam</strong> or <strong>Promotions</strong> and ensure your email client shows attachments.</p>
        </td></tr>
      </table>`
    : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:2px solid #f87171;border-radius:12px;margin-bottom:24px;">
        <tr><td style="padding:20px 24px;">
          <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#991b1b;">We couldn't attach your PDF this time</p>
          <p style="margin:0;font-size:14px;color:#7f1d1d;">Please go back to <strong>reps-dz.com</strong>, open the Programs page, and generate your free 1-week program again. If the issue persists, contact us.</p>
        </td></tr>
      </table>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your 1-Week Calisthenics Program</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f1f5f9;color:#1e293b;line-height:1.6;">
  <div style="display:none;max-height:0;overflow:hidden;">Your 1-week calisthenics program is attached to this email as a PDF.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.08),0 4px 10px -5px rgba(0,0,0,0.04);">
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:40px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:0.15em;text-transform:uppercase;">Toufik Calisthenics</p>
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#fff;">Your 1-Week Program Is Ready</h1>
              <p style="margin:10px 0 0;font-size:14px;color:#94a3b8;">4 Sessions · Level ${level}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px;">
              <p style="margin:0 0 20px;font-size:16px;color:#334155;">${greeting}</p>
              <p style="margin:0 0 24px;font-size:15px;color:#334155;">Your <strong>1-week calisthenics program</strong> ${hasPdf ? 'is attached to this email as a <strong>PDF file</strong>. Open it to see your 4 sessions, exercises, and — if you added height & weight — your daily calorie and protein targets.' : 'request was received. Unfortunately we could not generate the PDF attachment right now.'}</p>
              ${attachmentBlock}
              <p style="margin:0;font-size:15px;color:#334155;">${hasPdf ? 'Save the PDF to your device or print it, then train consistently. Enjoy your week!' : 'Thank you for your patience.'}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:14px;font-weight:600;color:#475569;">Toufik Calisthenics</p>
              <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">reps-dz.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function send1WeekProgramEmail(to, userName, programData, options = {}) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'Toufik Calisthenics';

  if (!apiKey || !senderEmail) {
    throw new Error('Email not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL.');
  }

  const nameStr = (userName && String(userName).trim()) ? String(userName).trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '') : 'program';
  const levelStr = (programData.level || 'intermediate').charAt(0).toUpperCase() + (programData.level || 'intermediate').slice(1);
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Your-1Week-Calisthenics-Program-${levelStr}-${nameStr}-${dateStr}.pdf`;

  let pdfBuffer;
  let pdfFailed = false;
  try {
    pdfBuffer = await generate1WeekPdfBuffer(programData, {
      userName: (userName && String(userName).trim()) || 'user',
      userAge: options.userAge,
      level: programData.level || 'intermediate',
      goals: options.goals || []
    });
  } catch (pdfErr) {
    console.error('[Brevo] 1-week PDF generation failed (Puppeteer/Chromium may be unavailable):', pdfErr.message);
    pdfFailed = true;
  }

  const hasPdf = !pdfFailed && Buffer.isBuffer(pdfBuffer) && pdfBuffer.length > 0;
  const attachments = hasPdf ? [{ name: filename, content: pdfBuffer.toString('base64') }] : [];
  if (hasPdf) {
    console.log('[Brevo] Attaching 1-week PDF:', filename, 'size:', pdfBuffer.length, 'bytes');
  } else {
    console.warn('[Brevo] Sending 1-week email without PDF attachment (PDF generation unavailable)');
  }

  const html = build1WeekProgramHtml(userName, programData, hasPdf ? filename : null);

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to, ...(userName && { name: userName }) }],
    subject: hasPdf ? 'Your 1-Week Calisthenics Program — PDF attached' : 'Your 1-Week Calisthenics Program',
    htmlContent: html
  };
  if (attachments.length > 0) payload.attachment = attachments;

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'accept': 'application/json', 'api-key': apiKey.trim(), 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const errBody = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = errBody.message || errBody.code || `Brevo API error: ${response.status}`;
    console.error('[Brevo] 1-week send failed:', JSON.stringify({ status: response.status, body: errBody }));
    throw new Error(msg);
  }
  console.log('[Brevo] 1-week email with PDF sent to', to);
}

/** Send customized program request to admin. Form data will be forwarded to admin email. */
async function sendCustomizedRequestEmail(formData) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'Toufik Calisthenics';
  const adminEmail = process.env.ADMIN_EMAIL || senderEmail;

  if (!apiKey || !senderEmail) {
    throw new Error('Email not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL.');
  }

  const { name, email, pullExercises, pushExercises, cardioLegs, other, description, heightCm, weightKg, calisthenicsMainSport, otherSport } = formData;
  const safe = (s) => (s != null && String(s).trim() !== '') ? String(s).trim() : '—';
  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#334155;">
  <h2 style="color:#0f172a;">New Customized Program Request</h2>
  <p><strong>From:</strong> ${safe(name)} &lt;${safe(email)}&gt;</p>
  <p><strong>Main sport:</strong> ${calisthenicsMainSport ? 'Calisthenics' : (otherSport ? otherSport.charAt(0).toUpperCase() + otherSport.slice(1) : '—')}</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;">
  <h3 style="color:#475569;">Pull Exercises (Pull-ups, Muscle-ups)</h3>
  <p>${safe(pullExercises).replace(/\n/g, '<br>')}</p>
  <h3 style="color:#475569;">Push Exercises (Dips, Push-ups)</h3>
  <p>${safe(pushExercises).replace(/\n/g, '<br>')}</p>
  <h3 style="color:#475569;">Cardio & Legs (Squat, Leg raises, Burpees)</h3>
  <p>${safe(cardioLegs).replace(/\n/g, '<br>')}</p>
  <h3 style="color:#475569;">Other</h3>
  <p>${safe(other).replace(/\n/g, '<br>')}</p>
  <h3 style="color:#475569;">Description</h3>
  <p>${safe(description).replace(/\n/g, '<br>')}</p>
  ${((heightCm != null && String(heightCm).trim()) || (weightKg != null && String(weightKg).trim())) ? `<p><strong>Height:</strong> ${safe(heightCm)} cm · <strong>Weight:</strong> ${safe(weightKg)} kg</p>` : ''}
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;">
  <p style="font-size:12px;color:#94a3b8;">Sent from reps-dz.com Programs page</p>
</body></html>`;

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: adminEmail }],
    replyTo: { email: safe(email), name: safe(name) },
    subject: `[Custom Program] Request from ${safe(name)}`,
    htmlContent: html
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { accept: 'application/json', 'api-key': apiKey.trim(), 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const errBody = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(errBody.message || errBody.code || `Brevo API error: ${response.status}`);
  }
  console.log('[Brevo] Customized request forwarded to', adminEmail);
}

module.exports = { sendProgramEmail, send1WeekProgramEmail, sendCustomizedRequestEmail, buildProgramHtml, build1WeekProgramHtml };
