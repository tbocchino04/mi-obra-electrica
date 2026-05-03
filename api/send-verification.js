import { Resend } from "resend";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, nombre, token } = req.body;
  if (!email || !token) return res.status(400).json({ error: "Faltan datos" });

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const link   = `https://mi-obra-electrica.vercel.app/?verify=${token}`;

    await resend.emails.send({
      from:    "Grupo V&B <onboarding@resend.dev>",
      to:      email,
      subject: "Confirmá tu cuenta — Grupo V&B",
      html:    emailHtml(nombre || "Usuario", link),
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Resend error:", err);
    res.status(500).json({ error: err.message });
  }
}

function emailHtml(nombre, link) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verificá tu cuenta</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.07);">
          <tr>
            <td style="background:#0d0b14;padding:32px 40px;text-align:center;">
              <span style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-0.03em;">GRUPO V&amp;B</span>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0d0b14;letter-spacing:-0.04em;">
                Hola, ${nombre}
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6b6880;line-height:1.6;">
                Gracias por registrarte. Hacé click en el botón para confirmar tu email y acceder a la plataforma.
              </p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${link}"
                      style="display:inline-block;background:#7c3aed;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;letter-spacing:-0.02em;">
                      Verificar mi cuenta
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 0;font-size:12px;color:#9896aa;text-align:center;line-height:1.5;">
                El link vence en 24 horas. Si no creaste esta cuenta, ignorá este email.<br/>
                <a href="${link}" style="color:#7c3aed;word-break:break-all;">${link}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f5f4f9;padding:20px 40px;text-align:center;border-top:1px solid #eceaf4;">
              <p style="margin:0;font-size:11px;color:#9896aa;">Grupo V&amp;B · Instalaciones eléctricas</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
