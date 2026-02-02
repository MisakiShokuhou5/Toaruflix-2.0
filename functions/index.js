// ARQUIVO: functions/index.js
const functions = require("firebase-functions");

// --- CONFIGURAÇÃO DO MAILERSEND (SMTP) ---
// NOTA: Para usar SMTP (Nodemailer), você precisará instalar o Nodemailer: npm install nodemailer
// MailerSend oferece credenciais SMTP que você precisaria configurar aqui ou no ambiente.
// Visto que já configuramos uma chave API, vamos simular que estamos usando o MailerSend via API.

// Para fins de demonstração, continuaremos usando a estrutura do SendGrid/API, 
// pois a chave API é o que foi configurado via CLI.
const MAILERSEND_API_KEY = functions.config().mailersend.key;

// IMPORTANTE: Para usar a API MailerSend diretamente, você precisaria de um cliente HTTP como 'axios' ou 'node-fetch'.
// Vamos usar AXIOS para fazer a chamada POST para o MailerSend API.
const axios = require('axios'); // Instale: npm install axios --prefix functions

exports.sendAdminReplyEmail = functions.firestore
    .document("support_tickets/{ticketId}")
    .onUpdate(async (change, context) => {
        const after = change.after.data();
        const before = change.before.data();

        // 1. Condição de disparo: Status mudou para Resolvido E uma resposta foi adicionada.
        const isNowResolved = before.status !== "Resolvido" && after.status === "Resolvido";
        const hasAdminResponse = after.adminResponse && after.adminResponse !== before.adminResponse;

        if (!isNowResolved || !hasAdminResponse) {
            return null; // Não envia se não for a atualização final de resposta
        }

        const userEmail = after.email;
        const adminResponse = after.adminResponse;
        const ticketSubject = after.subject;
        const fromEmail = "gogetafustoarucrunchyrol@gmail.com"; // 🛑 MUDAR PARA O SEU ENDEREÇO VERIFICADO

        // 2. Construindo o Payload do MailerSend
        const emailData = {
            from: {
                email: fromEmail,
                name: "Suporte ToaruFlix",
            },
            to: [{ email: userEmail }],
            subject: `[TICKET RESOLVIDO] Resposta ao seu chamado: ${ticketSubject}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Olá!</h2>
                    <p>Seu ticket de suporte sobre: <strong>${ticketSubject}</strong> foi resolvido.</p>
                    <hr>
                    <h3>Nossa Resposta:</h3>
                    <div style="background: #e6e6e6; padding: 15px; border-radius: 5px; border-left: 3px solid #8a2be2; color: #333;">
                        <p>${adminResponse.replace(/\n/g, '<br>')}</p>
                    </div>
                    <hr>
                    <p>Atenciosamente,<br>Equipe de Suporte.</p>
                </div>
            `,
        };

        // 3. Chamada para a API MailerSend
        try {
            await axios.post(
                'https://api.mailersend.com/v1/email', 
                emailData, 
                {
                    headers: {
                        'Authorization': `Bearer ${MAILERSEND_API_KEY}`,
                        'Content-Type': 'application/json',
                        'X-Mailer-Engine': 'Firebase Functions', // Opcional
                    },
                }
            );
            console.log(`Email de resposta via MailerSend enviado com sucesso para: ${userEmail}`);
            return true;
        } catch (error) {
            console.error("ERRO NO ENVIO DO EMAIL (MailerSend API):", error.response ? error.response.data : error.message);
            return false;
        }
    });