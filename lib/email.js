import nodemailer from 'nodemailer';

let transporter;

async function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('EMAIL ERROR: SMTP environment variables not set.');
    transporter = { sendMail: async () => console.error("Email not sent: SMTP config missing.") };
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

export async function sendProjectSubmissionEmail(supervisorEmail, studentName, projectTitle, projectId) {
  const currentTransporter = await getTransporter();
  const reviewLink = `${process.env.NEXTAUTH_URL}/supervisor/review/${projectId}`;
  const senderEmail = process.env.EMAIL_FROM || `"Project Repository" <noreply@yourdomain.com>`;

  const mailOptions = {
    from: senderEmail,
    to: supervisorEmail,
    subject: `New Project Submission for Review: ${projectTitle}`,
    html: `<p>Hello,</p><p>Student <strong>${studentName}</strong> has submitted a project draft titled "<strong>${projectTitle}</strong>" for your review.</p><p>Please review it here: <a href="${reviewLink}">${reviewLink}</a></p>`,
  };

  try {
    const info = await currentTransporter.sendMail(mailOptions);
    console.log('Project submission email sent: %s', info.messageId);
  } catch (error) {
    console.error(`Error sending submission email:`, error);
  }
}

export async function sendProjectStatusUpdateEmail(studentEmail, studentName, projectTitle, status, comments = '') {
  const currentTransporter = await getTransporter();
  const projectLink = `${process.env.NEXTAUTH_URL}/dashboard`;
  const senderEmail = process.env.EMAIL_FROM || `"Project Repository" <noreply@yourdomain.com>`;

  let subject = '';
  let htmlBody = `<p>Hello ${studentName},</p><p>There is an update on your project, "<strong>${projectTitle}</strong>".</p>`;

  if (status === 'REJECTED') {
    subject = `Project Draft Requires Revisions`;
    htmlBody += `<p>Your supervisor has reviewed your draft and it requires revisions before it can be approved.</p>`;
    if (comments) {
      htmlBody += `<h3>Supervisor's Comments:</h3><div style="background-color: #f0f0f0; padding: 10px; border-radius: 5px;">${comments.replace(/\n/g, '<br>')}</div>`;
    }
  } else if (status === 'APPROVED_FOR_FINAL') {
    subject = `Project Draft Approved!`;
    htmlBody += `<p>Congratulations! Your draft has been <strong>APPROVED</strong>. You can now log in to upload your final report.</p>`;
  } else {
    return; // Don't send email for other statuses yet
  }

  htmlBody += `<p>You can view your project status on your dashboard: <a href="${projectLink}">${projectLink}</a></p>`;

  const mailOptions = { from: senderEmail, to: studentEmail, subject, html: htmlBody };

  try {
    await currentTransporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`Error sending status update email:`, error);
  }
}
