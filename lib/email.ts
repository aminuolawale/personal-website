type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "aminuolawalekan@gmail.com";

function shell(title: string, body: string) {
  return `
    <div style="margin:0;padding:0;background:#0f172a;color:#cbd5e1;font-family:Inter,Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0f172a;padding:32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;border:1px solid rgba(248,250,252,0.12);background:rgba(248,250,252,0.03);">
              <tr>
                <td style="padding:28px 28px 12px 28px;">
                  <div style="font-family:'Space Mono',monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#38bdf8;">Aminu Olawale</div>
                  <h1 style="margin:12px 0 0 0;color:#f8fafc;font-size:28px;line-height:1.15;font-weight:700;">${title}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 28px 32px 28px;">${body}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendEmail({ to, subject, html, text }: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.warn("Email skipped: RESEND_API_KEY or EMAIL_FROM is not configured");
    return { skipped: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!res.ok) {
    const message = await res.text().catch(() => "");
    throw new Error(`Email send failed: ${res.status} ${message}`);
  }

  return { skipped: false };
}

export async function sendNewReaderAdminEmail(input: {
  email: string;
  name?: string | null;
}) {
  const html = shell("New reader signed in", `
    <p style="margin:0 0 16px 0;color:#cbd5e1;font-size:15px;line-height:1.7;">A reader authenticated on the site.</p>
    <div style="border:1px solid rgba(248,250,252,0.12);padding:16px;background:rgba(248,250,252,0.04);">
      <p style="margin:0;color:#f8fafc;font-size:15px;">${escapeHtml(input.name ?? "Unnamed reader")}</p>
      <p style="margin:6px 0 0 0;color:#38bdf8;font-family:'Space Mono',monospace;font-size:12px;">${escapeHtml(input.email)}</p>
    </div>
  `);

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `New reader: ${input.email}`,
    html,
    text: `New reader signed in\n${input.name ?? "Unnamed reader"}\n${input.email}`,
  });
}
