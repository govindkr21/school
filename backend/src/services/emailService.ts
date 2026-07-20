import sgMail from '@sendgrid/mail'
import { OtpPurpose } from '../models/EmailOtp'

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

const BRAND_NAME = process.env.BRAND_NAME || 'Madnir'
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@madnir.com'

function otpEmailCopy(purpose: OtpPurpose) {
  if (purpose === 'PASSWORD_RESET') {
    return {
      subject: `${BRAND_NAME} password reset code`,
      heading: 'Reset your password',
      body: `Use the code below to reset the password on your ${BRAND_NAME} admin account. If you didn't request this, you can safely ignore this email.`
    }
  }
  return {
    subject: `${BRAND_NAME} verification code`,
    heading: 'Verify your email',
    body: `Use the code below to verify your email and finish registering your organisation on ${BRAND_NAME}.`
  }
}

export function renderOtpEmailHtml(params: { otp: string; purpose: OtpPurpose; orgName?: string }) {
  const { otp, purpose, orgName } = params
  const copy = otpEmailCopy(purpose)
  const digits = otp.split('')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${copy.subject}</title>
<style>
  @media (prefers-color-scheme: dark) {
    .bg { background-color: #0f1a15 !important; }
    .card { background-color: #14231b !important; border-color: #24382c !important; }
    .text { color: #f2efe6 !important; }
    .muted { color: #9db3a5 !important; }
    .otp-box { background-color: #1b3327 !important; border-color: #2f7b55 !important; }
  }
</style>
</head>
<body class="bg" style="margin:0;padding:0;background-color:#FBF8F0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" class="card" style="max-width:480px;width:100%;background-color:#FFFFFF;border:1px solid #EAE1CC;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background-color:#134430;padding:28px 32px;">
              <span style="font-size:18px;font-weight:700;color:#FBF8F0;letter-spacing:-0.02em;">${BRAND_NAME}</span>
              ${orgName ? `<div style="margin-top:4px;font-size:12px;color:#9dd3b4;letter-spacing:0.08em;text-transform:uppercase;">${orgName}</div>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 class="text" style="margin:0 0 12px;font-size:22px;color:#14231B;">${copy.heading}</h1>
              <p class="muted" style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#5C6B62;">${copy.body}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" class="otp-box" style="background-color:#E7F1E9;border:1px solid #1B5E3F;border-radius:12px;padding:20px;">
                    <span style="font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:32px;font-weight:600;letter-spacing:10px;color:#134430;">${digits.join('')}</span>
                  </td>
                </tr>
              </table>
              <p class="muted" style="margin:20px 0 0;font-size:13px;color:#8B978F;">This code expires in 5 minutes. If you didn't request it, no action is needed.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #EAE1CC;">
              <p class="muted" style="margin:0;font-size:12px;color:#8B978F;">Need help? Contact <a href="mailto:${SUPPORT_EMAIL}" style="color:#1B5E3F;">${SUPPORT_EMAIL}</a></p>
              <p class="muted" style="margin:8px 0 0;font-size:11px;color:#8B978F;">© ${new Date().getFullYear()} ${BRAND_NAME}. Automated message, please don't reply directly.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendOtpEmail(params: { to: string; otp: string; purpose: OtpPurpose; orgName?: string }): Promise<boolean> {
  const { to, otp, purpose, orgName } = params
  const copy = otpEmailCopy(purpose)

  if (!process.env.SENDGRID_API_KEY) {
    // eslint-disable-next-line no-console
    console.log(`[email:dev] OTP for ${to} (${purpose}): ${otp}`)
    return false
  }

  try {
    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM || 'no-reply@madnir.com',
      subject: copy.subject,
      text: `Your ${BRAND_NAME} verification code is ${otp}. It expires in 5 minutes.`,
      html: renderOtpEmailHtml({ otp, purpose, orgName })
    })
    return true
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('sendgrid error', err)
    return false
  }
}
