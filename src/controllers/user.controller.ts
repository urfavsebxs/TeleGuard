import { Request, Response } from 'express';
import { User, IUser } from '../models/User.model';
import { getClient, sendInviteLink } from '../services/telegram.service';
import { Api } from 'telegram/tl';

// GET /api/users - Listar todos los usuarios
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { active, expired } = req.query;
    let query: any = {};

    if (active === 'true') {
      query.isActive = true;
    } else if (active === 'false') {
      query.isActive = false;
    }

    if (expired === 'true') {
      query.expirationDate = { $lte: new Date() };
    } else if (expired === 'false') {
      query.expirationDate = { $gt: new Date() };
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error: any) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuarios',
      message: error.message,
    });
  }
};

// GET /api/users/:id - Obtener usuario por ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuario',
      message: error.message,
    });
  }
};

// POST /api/users - Crear nuevo usuario
export const createUser = async (req: Request, res: Response) => {
  try {
    const { telegramId, firstName, lastName, username, paymentDurationDays, registrationDate, notes } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ telegramId });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'El usuario ya existe',
        message: `Usuario con Telegram ID ${telegramId} ya está registrado`,
      });
    }

    const user = new User({
      telegramId,
      firstName,
      lastName,
      username,
      paymentDurationDays,
      registrationDate: registrationDate ? new Date(registrationDate) : new Date(),
      notes,
    });

    await user.save();

    console.log(`✅ Usuario creado: ${user.firstName} (${user.telegramId})`);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: user,
    });
  } catch (error: any) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear usuario',
      message: error.message,
    });
  }
};

// PUT /api/users/:id - Actualizar usuario
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, username, paymentDurationDays, registrationDate, isActive, notes } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    // Actualizar campos
    if (firstName) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (username !== undefined) user.username = username;
    if (paymentDurationDays) user.paymentDurationDays = paymentDurationDays;
    if (registrationDate) user.registrationDate = new Date(registrationDate);
    if (isActive !== undefined) user.isActive = isActive;
    if (notes !== undefined) user.notes = notes;

    await user.save();

    console.log(`✅ Usuario actualizado: ${user.firstName} (${user.telegramId})`);

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: user,
    });
  } catch (error: any) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar usuario',
      message: error.message,
    });
  }
};

// DELETE /api/users/:id - Eliminar usuario
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    // Intentar expulsar del grupo de Telegram
    let telegramRemoved = false;
    let telegramError = null;

    try {
      const client = getClient();
      const groupId = process.env.TELEGRAM_GROUP_ID;

      if (!client) {
        console.warn('⚠️  Cliente de Telegram no disponible');
      } else if (!groupId) {
        console.warn('⚠️  TELEGRAM_GROUP_ID no configurado');
      } else {
        console.log(`🚫 Intentando expulsar a ${user.firstName} (${user.telegramId}) del grupo...`);

        try {
          // Primero obtener la entidad del usuario desde el grupo
          // @ts-ignore
          const participants = await client.invoke(
            new Api.channels.GetParticipants({
              channel: groupId,
              filter: new Api.ChannelParticipantsSearch({ q: '' }),
              offset: 0,
              limit: 1000,
              // @ts-ignore
              hash: 0,
            })
          );

          if (!('users' in participants)) {
            throw new Error('No se pudieron obtener los participantes del grupo');
          }

          // Buscar el usuario específico
          const targetUser = participants.users.find((u: any) => u.id?.toString() === user.telegramId);
          
          if (!targetUser) {
            console.log(`⚠️ Usuario ${user.telegramId} no encontrado en el grupo (ya fue expulsado o no está)`);
            telegramRemoved = true; // Considerarlo éxito si ya no está
            telegramError = 'El usuario ya no está en el grupo';
          } else {
            // Ahora sí, banear temporalmente para expulsar usando la entidad encontrada
            await client.invoke(
              new Api.channels.EditBanned({
                channel: groupId,
                participant: targetUser,
                bannedRights: new Api.ChatBannedRights({
                  untilDate: Math.floor(Date.now() / 1000) + 60, // 60 segundos
                  viewMessages: true, // true = no puede ver mensajes (lo expulsa)
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

            console.log(`⏳ Usuario restringido temporalmente, esperando 2 segundos...`);
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Luego, quitar el baneo para que pueda volver a entrar
            await client.invoke(
              new Api.channels.EditBanned({
                channel: groupId,
                participant: targetUser,
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

            telegramRemoved = true;
            console.log(`✅ Usuario expulsado del grupo de Telegram (puede volver a entrar con invitación)`);
          }
        } catch (telegramErr: any) {
          console.error('❌ Error específico de Telegram:', telegramErr.message);
          if (telegramErr.message?.includes('CHAT_ADMIN_REQUIRED')) {
            telegramError = 'Se requieren permisos de administrador en el grupo';
          } else if (telegramErr.message?.includes('USER_NOT_PARTICIPANT')) {
            telegramError = 'El usuario ya no está en el grupo';
            telegramRemoved = true; // Considerarlo como éxito
          } else if (telegramErr.message?.includes('Could not find the input entity')) {
            telegramError = 'El usuario ya no está en el grupo';
            telegramRemoved = true; // Considerarlo como éxito
            console.log('ℹ️  Usuario no encontrado en Telegram (probablemente ya fue expulsado)');
          } else {
            telegramError = telegramErr.message;
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Error al expulsar de Telegram:', error.message);
      telegramError = error.message;
    }

    // Eliminar de la base de datos
    await User.findByIdAndDelete(req.params.id);

    console.log(`🗑️  Usuario eliminado de la BD: ${user.firstName} (${user.telegramId})`);

    res.json({
      success: true,
      message: telegramRemoved 
        ? 'Usuario eliminado de la base de datos y expulsado del grupo de Telegram'
        : 'Usuario eliminado de la base de datos' + (telegramError ? ` (No se pudo expulsar de Telegram: ${telegramError})` : ''),
      data: {
        user,
        telegramRemoved,
        telegramError,
      },
    });
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar usuario',
      message: error.message,
    });
  }
};

// POST /api/users/:id/extend - Extender suscripción
export const extendSubscription = async (req: Request, res: Response) => {
  try {
    const { additionalDays } = req.body;

    if (additionalDays === undefined || additionalDays === null || additionalDays === 0) {
      return res.status(400).json({
        success: false,
        error: 'Días adicionales inválidos',
        message: 'Debes proporcionar un número de días diferente de 0',
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    const wasInactive = !user.isActive;
    console.log(`🔍 Usuario ${user.firstName}: wasInactive=${wasInactive}, isActive=${user.isActive}`);
    
    await user.extendSubscription(additionalDays);
    
    console.log(`🔍 Después de extender: isActive=${user.isActive}, expirationDate=${user.expirationDate}`);

    const action = additionalDays > 0 ? 'extendida' : 'reducida';
    console.log(`📅 Suscripción ${action}: ${user.firstName} (${additionalDays > 0 ? '+' : ''}${additionalDays} días)`);

    // Si el usuario estaba inactivo y se le extendieron días positivos, enviar enlace de invitación
    let inviteLinkInfo = null;
    if (wasInactive && additionalDays > 0 && user.isActive) {
      console.log(`📨 Enviando enlace de invitación a ${user.firstName}...`);
      const result = await sendInviteLink(user.telegramId, user.firstName, additionalDays);
      
      inviteLinkInfo = {
        sent: result.sent,
        link: result.link,
        message: result.sent 
          ? 'Enlace enviado al usuario por Telegram' 
          : 'No se pudo enviar el mensaje. Comparte este enlace manualmente:'
      };
      
      if (result.sent) {
        console.log(`✅ Enlace enviado a ${user.telegramId}`);
      } else {
        console.log(`⚠️ No se pudo enviar el enlace a ${user.telegramId}. Link: ${result.link}`);
      }
    } else {
      console.log(`⏭️ No se envió enlace: wasInactive=${wasInactive}, additionalDays=${additionalDays}, isActive=${user.isActive}`);
    }

    res.json({
      success: true,
      message: `Suscripción ${action} por ${Math.abs(additionalDays)} días`,
      data: user,
      inviteLink: inviteLinkInfo,
    });
  } catch (error: any) {
    console.error('Error al extender suscripción:', error);
    res.status(500).json({
      success: false,
      error: 'Error al extender suscripción',
      message: error.message,
    });
  }
};

// POST /api/users/:id/reduce - Reducir suscripción
export const reduceSubscription = async (req: Request, res: Response) => {
  try {
    const { daysToReduce } = req.body;

    if (!daysToReduce || daysToReduce < 1) {
      return res.status(400).json({
        success: false,
        error: 'Días a reducir inválidos',
        message: 'Debes proporcionar un número de días mayor a 0',
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    await user.reduceSubscription(daysToReduce);

    console.log(`📅 Suscripción reducida: ${user.firstName} (-${daysToReduce} días)`);

    res.json({
      success: true,
      message: `Suscripción reducida por ${daysToReduce} días`,
      data: user,
    });
  } catch (error: any) {
    console.error('Error al reducir suscripción:', error);
    res.status(500).json({
      success: false,
      error: 'Error al reducir suscripción',
      message: error.message,
    });
  }
};

// GET /api/users/stats - Estadísticas
export const getStats = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    
    const [total, active, inactive, expired] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ 
        isActive: true,
        expirationDate: { $gt: now }  // Activos: isActive=true Y fecha futura
      }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ 
        expirationDate: { $lte: now }  // Expirados: fecha ya pasada (sin importar isActive)
      }),
    ]);

    res.json({
      success: true,
      data: {
        total,
        active,
        inactive,
        expired,
      },
    });
  } catch (error: any) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas',
      message: error.message,
    });
  }
};
