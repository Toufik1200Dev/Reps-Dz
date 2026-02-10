/**
 * Send 6-week program to user's email via Brevo API.
 * Requires: BREVO_API_KEY, BREVO_SENDER_EMAIL (verified sender in Brevo)
 * Optional: BREVO_SENDER_NAME (default: Toufik Calisthenics)
 */
const { generate6WeekPdfBuffer, generate1WeekPdfBuffer } = require('./programPdfService');

function buildProgramHtml(userName, data, weeksCount) {
  const w = weeksCount === 12 ? 12 : 6;
  const weekLabel = w === 12 ? '12-week' : '6-week';
  const testWeek = w === 12 ? 'week 12' : 'week 6';
  const level = (data.level || 'intermediate').charAt(0).toUpperCase() + (data.level || 'intermediate').slice(1);
  const firstName = userName ? userName.split(/\s+/)[0] : '';
  const greeting = firstName ? `Hi ${firstName},` : 'Hello,';
  const nut = data.nutrition || {};
  const hasNutrition = nut.tdee || nut.proteinG;

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
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f1f5f9;color:#1e293b;line-height:1.5;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;">Your personalized ${weekLabel} calisthenics program is ready. Open this email to download your PDF.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -2px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:40px 40px 36px;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#94a3b8;letter-spacing:0.1em;text-transform:uppercase;">Toufik Calisthenics</p>
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.025em;">Your Program Is Ready</h1>
              <p style="margin:8px 0 0;font-size:15px;color:#94a3b8;">${weekLabel.replace('week', 'Week')} Training Plan — Level ${level}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 20px;font-size:16px;color:#334155;">${greeting}</p>
              <p style="margin:0 0 24px;font-size:16px;color:#334155;">Thank you for your purchase. Your personalized <strong>${weekLabel} calisthenics program</strong> is attached to this email as a PDF.</p>
              
              <!-- Attachment callout -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:16px;">
                          <div style="width:48px;height:48px;background:#fef3c7;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;">📎</div>
                        </td>
                        <td>
                          <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#1e293b;">PDF Attachment</p>
                          <p style="margin:0;font-size:13px;color:#64748b;">Your full program with exercises, sets, rest times, and nutrition — ready to save or print.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#475569;">What's included</p>
              <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#475569;">
                <li style="margin-bottom:6px;">${w} weeks of structured training (5 sessions per week)</li>
                <li style="margin-bottom:6px;">Personalized to your level and max reps</li>
                ${hasNutrition ? '<li style="margin-bottom:6px;">Daily calorie & protein estimates</li><li style="margin-bottom:6px;">Sample meal ideas with timing</li>' : ''}
                <li style="margin-bottom:6px;">Clear progression and rest days</li>
                <li>Endurance testing in ${testWeek}</li>
              </ul>
              
              <p style="margin:0 0 24px;font-size:15px;color:#334155;">Open the attached PDF to view your full program. You can save it to your device, print it, or keep it handy for your workouts.</p>
              
              <p style="margin:0;font-size:15px;color:#334155;">Train consistently and enjoy the journey.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
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

async function sendProgramEmail(to, userName, programData, options = {}) {
  const { weeksCount = 6 } = options;
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'Toufik Calisthenics';

  if (!apiKey || !senderEmail) {
    throw new Error('Email not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL in environment. Sender must be verified in Brevo dashboard.');
  }

  const html = buildProgramHtml(userName, programData, weeksCount);

  // Generate PDF and attach
  let attachments = [];
  try {
    const pdfBuffer = await generate6WeekPdfBuffer(programData, {
      userName: (userName && String(userName).trim()) || 'user',
      userAge: options.userAge,
      level: programData.level || 'intermediate',
      weeksCount,
      goals: options.goals || []
    });
    const nameStr = (userName && String(userName).trim()) ? String(userName).trim().replace(/\s+/g, '-') : 'program';
    const levelStr = (programData.level || 'intermediate').charAt(0).toUpperCase() + (programData.level || 'intermediate').slice(1);
    const dateStr = new Date().toISOString().split('T')[0];
    const weekLabel = weeksCount === 12 ? '12Week' : '6Week';
    const filename = `Your-${weekLabel}-Calisthenics-Program-${levelStr}-${nameStr}-${dateStr}.pdf`;
    attachments = [{
      name: filename,
      content: pdfBuffer.toString('base64')
    }];
  } catch (pdfErr) {
    console.error('PDF generation failed, sending without attachment:', pdfErr);
  }

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to, ...(userName && { name: userName }) }],
    subject: weeksCount === 12 ? 'Your 12-Week Calisthenics Program' : 'Your 6-Week Calisthenics Program',
    htmlContent: html
  };
  if (attachments.length > 0) {
    payload.attachment = attachments;
  }

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

  console.log('[Brevo] Email sent to', to);
}

/** Build HTML for 1-week free program email. */
function build1WeekProgramHtml(userName, data) {
  const level = (data.level || 'intermediate').charAt(0).toUpperCase() + (data.level || 'intermediate').slice(1);
  const firstName = userName ? userName.split(/\s+/)[0] : '';
  const greeting = firstName ? `Hi ${firstName},` : 'Hello,';
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Your 1-Week Calisthenics Program</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f1f5f9;color:#1e293b;line-height:1.5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
        <tr><td style="background:#0f172a;padding:32px;text-align:center;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#94a3b8;letter-spacing:0.1em;text-transform:uppercase;">Toufik Calisthenics</p>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;">Your 1-Week Program Is Ready</h1>
          <p style="margin:8px 0 0;font-size:14px;color:#94a3b8;">4 Sessions — Level ${level}</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;">${greeting}</p>
          <p style="margin:0 0 20px;font-size:15px;">Your <strong>1-week calisthenics program</strong> is attached as a PDF. Daily calorie and protein targets included (when height & weight provided).</p>
          <p style="margin:0 0 20px;font-size:14px;color:#475569;">Check your inbox and spam folder if you don't see it.</p>
          <p style="margin:0;font-size:15px;">Train consistently!</p>
        </td></tr>
        <tr><td style="padding:20px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0;font-size:13px;font-weight:600;color:#475569;">Toufik Calisthenics · reps-dz.com</p>
        </td></tr>
      </table>
    </td></tr>
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

  const html = build1WeekProgramHtml(userName, programData);
  let attachments = [];
  try {
    const pdfBuffer = await generate1WeekPdfBuffer(programData, {
      userName: (userName && String(userName).trim()) || 'user',
      userAge: options.userAge,
      level: programData.level || 'intermediate',
      goals: options.goals || []
    });
    const nameStr = (userName && String(userName).trim()) ? String(userName).trim().replace(/\s+/g, '-') : 'program';
    const levelStr = (programData.level || 'intermediate').charAt(0).toUpperCase() + (programData.level || 'intermediate').slice(1);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Your-1Week-Calisthenics-Program-${levelStr}-${nameStr}-${dateStr}.pdf`;
    attachments = [{ name: filename, content: pdfBuffer.toString('base64') }];
  } catch (pdfErr) {
    console.error('1-week PDF generation failed:', pdfErr);
  }

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to, ...(userName && { name: userName }) }],
    subject: 'Your 1-Week Calisthenics Program',
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
  console.log('[Brevo] 1-week email sent to', to);
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
