import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { StoreSession } from 'telegram/sessions';
import input from 'input';
import { Api } from 'telegram/tl';
import path from 'path';
import qrcode from 'qrcode-terminal';

let client: TelegramClient | null = null;
const SESSION_FILE = path.join(process.cwd(), 'telegram_session.txt');
const SESSION_STORE = path.join(process.cwd(), '.telegram-data');

export const initBot = async (): Promise<void> => {
  const apiId = parseInt(process.env.TELEGRAM_API_ID || '');
  const apiHash = process.env.TELEGRAM_API_HASH || '';
  const phoneNumber = process.env.TELEGRAM_PHONE_NUMBER || '';
  
  if (!apiId || !apiHash) {
    console.warn('⚠️  TELEGRAM_API_ID y TELEGRAM_API_HASH son requeridos');
    return;
  }

  try {
    // Cargar sesión desde variable de entorno o archivo
    let sessionString = '';
    
    // Prioridad 1: Variable de entorno (para producción)
    if (process.env.TELEGRAM_SESSION_STRING) {
      sessionString = process.env.TELEGRAM_SESSION_STRING.trim();
      console.log('📂 Sesión cargada desde variable de entorno');
    } 
    // Prioridad 2: Archivo local (para desarrollo)
    else {
      try {
        const fs = await import('fs');
        if (fs.existsSync(SESSION_FILE)) {
          sessionString = fs.readFileSync(SESSION_FILE, 'utf-8').trim();
          console.log('📂 Sesión cargada desde archivo');
        }
      } catch (error) {
        console.log('📝 Creando nueva sesión...');
      }
    }

    const stringSession = new StringSession(sessionString);
    client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
      useWSS: false,
      floodSleepThreshold: 0, // No esperar automáticamente en flood
    });

    console.log('🔄 Conectando a Telegram...');
    
    await client.connect();
    console.log('🔌 Conexión establecida');
    
    try {
      const me = await client.getMe();
      console.log(`✅ Ya autenticado como: ${(me as any).firstName}`);
    } catch (error) {
      console.log('📲 No autenticado, iniciando login por QR...\n');
      
      try {
        await client.signInUserWithQrCode(
          { apiId, apiHash },
          {
            qrCode: async (code) => {
              const token = code.token.toString('base64url');
              const loginUrl = `tg://login?token=${token}`;
              
              console.log('\n╔════════════════════════════════════╗');
              console.log('║   ESCANEA CON TU APP DE TELEGRAM  ║');
              console.log('╚════════════════════════════════════╝\n');
              
              // Mostrar QR Code visual en la terminal
              qrcode.generate(loginUrl, { small: true });
              
              console.log('\n📱 O abre este link en tu móvil:');
              console.log(`   https://t.me/login/${token}`);
              console.log('\n📋 Pasos:');
              console.log('   1. Abre Telegram en tu móvil');
              console.log('   2. Ve a Ajustes > Dispositivos');
              console.log('   3. Toca "Vincular dispositivo"');
              console.log('   4. Escanea el QR de arriba\n');
              console.log('⏳ Esperando...\n');
            },
            onError: (err) => {
              if (err.message !== 'Cannot read properties of undefined') {
                console.error('❌ Error QR:', err.message);
              }
            },
          }
        );
        
        console.log('✅ Autenticación completada!');
      } catch (authError: any) {
        console.error('❌ Error en autenticación:', authError.message);
        console.error('Stack:', authError.stack);
        throw authError;
      }
    }

    console.log('✅ Cliente de Telegram conectado');

    // Guardar sesión
    // @ts-ignore - session.save() puede retornar void pero funciona en runtime
    const session = client.session.save() as string | undefined;
    if (session) {
      try {
        const fs = await import('fs');
        fs.writeFileSync(SESSION_FILE, session);
        console.log('💾 Sesión guardada en', SESSION_FILE);
      } catch (error) {
        console.warn('⚠️  No se pudo guardar la sesión:', error);
      }
    }

    // Verificar que estamos autenticados
    const me = await client.getMe();
    console.log(`👤 Conectado como: ${(me as any).firstName || 'Usuario'}`);

  } catch (error: any) {
    if (error.errorMessage === 'FLOOD') {
      console.error(`\n⚠️  FLOOD WAIT ERROR`);
      console.error(`⏰ Debes esperar ${error.seconds} segundos (${Math.ceil(error.seconds / 60)} minutos)`);
      console.error(`💡 Telegram está limitando solicitudes desde tu cuenta.`);
      console.error(`📋 Soluciones:`);
      console.error(`   1. Espera ${Math.ceil(error.seconds / 60)} minutos e intenta de nuevo`);
      console.error(`   2. Usa una sesión ya autenticada (telegram_session.txt)`);
      console.error(`   3. Evita múltiples intentos de autenticación\n`);
      process.exit(1);
    }
    console.error('❌ Error al inicializar cliente de Telegram:', error);
    throw error;
  }
};

export const kickUserFromGroup = async (telegramId: string): Promise<boolean> => {
  if (!client) {
    console.error('❌ Cliente no inicializado');
    return false;
  }

  const groupId = process.env.TELEGRAM_GROUP_ID;
  
  if (!groupId) {
    console.error('❌ TELEGRAM_GROUP_ID no configurado');
    return false;
  }

  try {
    console.log(`🚫 Expulsando a usuario ${telegramId} del grupo...`);
    
    // Primero, obtener los participantes para encontrar al usuario
    // @ts-ignore - number es compatible con BigInteger en runtime
    const result = await client.invoke(
      new Api.channels.GetParticipants({
        channel: groupId,
        filter: new Api.ChannelParticipantsSearch({ q: '' }),
        offset: 0,
        limit: 1000,
        // @ts-ignore
        hash: 0,
      })
    );

    if ('users' in result) {
      // Buscar el usuario específico
      const user = result.users.find((u: any) => u.id?.toString() === telegramId);
      
      if (!user) {
        console.log(`⚠️ Usuario ${telegramId} no encontrado en el grupo (ya fue expulsado o no está)`);
        return true; // Considerarlo éxito si ya no está
      }

      // Banear temporalmente con viewMessages: true para expulsar
      await client.invoke(
        new Api.channels.EditBanned({
          channel: groupId,
          participant: user.id,
          bannedRights: new Api.ChatBannedRights({
            untilDate: Math.floor(Date.now() / 1000) + 60,
            viewMessages: true,
            sendMessages: true,
            sendMedia: true,
            sendStickers: true,
            sendGifs: true,
            sendGames: true,
            sendInline: true,
            embedLinks: true,
          }),
        })
      );

      console.log(`⏳ Esperando 2 segundos antes de desbanear...`);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Quitar el baneo para que pueda volver a entrar con invitación
      await client.invoke(
        new Api.channels.EditBanned({
          channel: groupId,
          participant: user.id,
          bannedRights: new Api.ChatBannedRights({
            untilDate: 0,
            viewMessages: false,
            sendMessages: false,
            sendMedia: false,
            sendStickers: false,
            sendGifs: false,
            sendGames: false,
            sendInline: false,
            embedLinks: false,
          }),
        })
      );

      console.log(`✅ Usuario ${telegramId} expulsado del grupo (puede volver con invitación)`);
      return true;
    }

    return false;
  } catch (error: any) {
    console.error(`❌ Error al expulsar usuario ${telegramId}:`, error.message);
    return false;
  }
};

export const sendMessageToUser = async (telegramId: string, message: string): Promise<boolean> => {
  if (!client) {
    console.error('❌ Cliente no inicializado');
    return false;
  }

  try {
    console.log(`📨 Enviando mensaje a ${telegramId}...`);
    
    // Intentar obtener la entidad del usuario desde el grupo
    const groupId = process.env.TELEGRAM_GROUP_ID;
    if (groupId) {
      try {
        const result = await client.invoke(
          new Api.channels.GetParticipants({
            channel: groupId,
            filter: new Api.ChannelParticipantsRecent(),
            offset: 0,
            limit: 1000,
            // @ts-ignore - BigInt es compatible con BigInteger en runtime
            hash: BigInt(0),
          })
        );

        if ('users' in result) {
          const user = result.users.find((u: any) => u.id?.toString() === telegramId);
          
          if (user) {
            await client.sendMessage(user, { message });
            console.log(`✅ Mensaje enviado a ${telegramId}`);
            return true;
          }
        }
      } catch (groupError) {
        console.log('⚠️ No se pudo obtener usuario del grupo, intentando con ID directo...');
      }
    }
    
    // Si no funcionó con el grupo, intentar directamente
    await client.sendMessage(telegramId, { message });
    console.log(`✅ Mensaje enviado a ${telegramId}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Error al enviar mensaje a ${telegramId}:`, error.message);
    return false;
  }
};

export const notifyExpiration = async (telegramId: string, firstName: string, daysLeft: number): Promise<void> => {
  let message = '';

  if (daysLeft === 3) {
    message = `⚠️ Hola ${firstName}, tu suscripción expira en **3 días**. Por favor, renueva tu pago.`;
  } else if (daysLeft === 1) {
    message = `🚨 Hola ${firstName}, tu suscripción expira **mañana**. Renueva urgentemente.`;
  } else if (daysLeft === 0) {
    message = `❌ Hola ${firstName}, tu suscripción ha **expirado**. Serás removido del grupo.`;
  }

  if (message) {
    await sendMessageToUser(telegramId, message);
  }
};

export const getClient = () => client;

// Función para generar enlace de invitación al grupo
export const generateInviteLink = async (): Promise<string | null> => {
  if (!client) {
    console.error('❌ Cliente no inicializado');
    return null;
  }

  const groupId = process.env.TELEGRAM_GROUP_ID;
  
  if (!groupId) {
    console.error('❌ TELEGRAM_GROUP_ID no configurado');
    return null;
  }

  try {
    console.log('🔗 Generando enlace de invitación...');
    
    const result = await client.invoke(
      new Api.messages.ExportChatInvite({
        peer: groupId,
        legacyRevokePermanent: false,
      })
    );

    if ('link' in result) {
      console.log(`✅ Enlace generado: ${result.link}`);
      return result.link;
    }

    return null;
  } catch (error: any) {
    console.error('❌ Error al generar enlace de invitación:', error.message);
    return null;
  }
};

// Función para enviar enlace de invitación a un usuario
export const sendInviteLink = async (telegramId: string, firstName: string, daysAdded: number): Promise<{ sent: boolean; link: string; error?: string }> => {
  const inviteLink = await generateInviteLink();
  
  if (!inviteLink) {
    console.error('❌ No se pudo generar el enlace de invitación');
    return { sent: false, link: '', error: 'No se pudo generar el enlace' };
  }

  const message = `🎉 ¡Hola ${firstName}! Tu suscripción ha sido extendida por ${daysAdded} días.\n\n` +
                  `✅ Ya puedes volver a unirte al grupo usando este enlace:\n${inviteLink}\n\n` +
                  `📅 Tu nueva fecha de expiración se ha actualizado.`;

  const sent = await sendMessageToUser(telegramId, message);
  
  return { 
    sent, 
    link: inviteLink,
    error: sent ? undefined : 'No se pudo enviar el mensaje al usuario'
  };
};

// Función para obtener información de un usuario por ID
export const getUserInfo = async (telegramId: string): Promise<any> => {
  if (!client) {
    throw new Error('Cliente no inicializado');
  }

  try {
    const user = await client.getEntity(telegramId);
    return user;
  } catch (error) {
    console.error(`❌ Error al obtener info de usuario ${telegramId}:`, error);
    return null;
  }
};

// Función para obtener miembros del grupo
export const getGroupMembers = async (groupId: string): Promise<any[]> => {
  if (!client) {
    throw new Error('Cliente no inicializado');
  }

  try {
    const result = await client.getParticipants(groupId, { limit: 200 });
    return result;
  } catch (error) {
    console.error('❌ Error al obtener miembros del grupo:', error);
    return [];
  }
};
