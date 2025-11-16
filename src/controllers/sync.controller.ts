import { Request, Response } from 'express';
import { Api } from 'telegram';
import { getClient } from '../services/telegram.service';
import { User } from '../models/User.model';

// Sincronizar usuarios del grupo de Telegram con la base de datos
export const syncGroupMembers = async (req: Request, res: Response) => {
  try {
    const groupId = process.env.TELEGRAM_GROUP_ID;
    
    if (!groupId) {
      return res.status(400).json({
        error: 'TELEGRAM_GROUP_ID no está configurado en .env',
      });
    }

    const client = getClient();
    
    if (!client) {
      return res.status(500).json({
        error: 'Cliente de Telegram no está inicializado',
      });
    }

    console.log(`📥 Obteniendo participantes del grupo ${groupId}...`);

    // Obtener los participantes del grupo
    const result = await client.invoke(
      new Api.channels.GetParticipants({
        channel: groupId,
        filter: new Api.ChannelParticipantsRecent(),
        offset: 0,
        limit: 200,
        // @ts-ignore - BigInt es compatible con BigInteger en runtime
        hash: BigInt(0),
      })
    );

    if (!('users' in result)) {
      return res.status(500).json({
        error: 'No se pudieron obtener los usuarios del grupo',
      });
    }

    const users = result.users;
    console.log(`👥 Encontrados ${users.length} usuarios en el grupo`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const telegramUser of users) {
      // Filtrar bots y usuarios eliminados
      if ('bot' in telegramUser && telegramUser.bot) {
        skipped++;
        continue;
      }

      if ('deleted' in telegramUser && telegramUser.deleted) {
        skipped++;
        continue;
      }

      const telegramId = telegramUser.id.toString();
      const firstName = 'firstName' in telegramUser ? telegramUser.firstName : 'Usuario';
      const lastName = 'lastName' in telegramUser ? telegramUser.lastName : undefined;
      const username = 'username' in telegramUser ? telegramUser.username : undefined;

      // Buscar si el usuario ya existe en la base de datos
      const existingUser = await User.findOne({ telegramId });

      if (existingUser) {
        // Actualizar información del usuario
        existingUser.firstName = firstName;
        existingUser.lastName = lastName;
        existingUser.username = username;
        await existingUser.save();
        updated++;
        console.log(`✅ Actualizado: ${firstName} ${lastName || ''} (@${username || 'sin username'})`);
      } else {
        // Crear nuevo usuario con 30 días por defecto
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30); // 30 días desde ahora
        
        const newUser = new User({
          telegramId,
          firstName,
          lastName,
          username,
          paymentDurationDays: 30,
          expirationDate,
          isActive: true,
        });
        await newUser.save();
        created++;
        console.log(`➕ Creado: ${firstName} ${lastName || ''} (@${username || 'sin username'}) - Expira: ${expirationDate.toLocaleDateString()}`);
      }
    }

    console.log(`\n📊 Resumen de sincronización:`);
    console.log(`   ➕ Creados: ${created}`);
    console.log(`   ✅ Actualizados: ${updated}`);
    console.log(`   ⏭️  Omitidos (bots/eliminados): ${skipped}`);

    res.json({
      success: true,
      message: 'Sincronización completada',
      stats: {
        total: users.length,
        created,
        updated,
        skipped,
      },
    });
  } catch (error: any) {
    console.error('❌ Error sincronizando usuarios del grupo:', error);
    res.status(500).json({
      error: 'Error al sincronizar usuarios',
      message: error.message,
    });
  }
};

// Sincronizar usuarios del grupo usando la fecha de ingreso al grupo
export const syncGroupMembersWithJoinDate = async (req: Request, res: Response) => {
  try {
    const groupId = process.env.TELEGRAM_GROUP_ID;
    
    if (!groupId) {
      return res.status(400).json({
        error: 'TELEGRAM_GROUP_ID no está configurado en .env',
      });
    }

    const client = getClient();
    
    if (!client) {
      return res.status(500).json({
        error: 'Cliente de Telegram no está inicializado',
      });
    }

    console.log(`📥 Obteniendo participantes del grupo ${groupId} con fechas de ingreso...`);

    // Obtener los participantes del grupo
    const result = await client.invoke(
      new Api.channels.GetParticipants({
        channel: groupId,
        filter: new Api.ChannelParticipantsRecent(),
        offset: 0,
        limit: 200,
        // @ts-ignore - BigInt es compatible con BigInteger en runtime
        hash: BigInt(0),
      })
    );

    if (!('users' in result)) {
      return res.status(500).json({
        error: 'No se pudieron obtener los usuarios del grupo',
      });
    }

    const users = result.users;
    console.log(`👥 Encontrados ${users.length} usuarios en el grupo`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const telegramUser of users) {
      // Filtrar bots y usuarios eliminados
      if ('bot' in telegramUser && telegramUser.bot) {
        skipped++;
        continue;
      }

      if ('deleted' in telegramUser && telegramUser.deleted) {
        skipped++;
        continue;
      }

      const telegramId = telegramUser.id.toString();
      const firstName = 'firstName' in telegramUser ? telegramUser.firstName : 'Usuario';
      const lastName = 'lastName' in telegramUser ? telegramUser.lastName : undefined;
      const username = 'username' in telegramUser ? telegramUser.username : undefined;

      // Obtener información del participante (para verificar rol Y fecha)
      let joinDate = new Date();
      let isAdminOrOwner = false;
      
      try {
        const participantInfo = await client.invoke(
          new Api.channels.GetParticipant({
            channel: groupId,
            participant: telegramUser.id,
          })
        );

        if ('participant' in participantInfo) {
          const participant = participantInfo.participant;
          
          // Verificar si es admin o propietario
          if (participant.className === 'ChannelParticipantAdmin' || 
              participant.className === 'ChannelParticipantCreator') {
            isAdminOrOwner = true;
            skipped++;
            console.log(`⏭️  Omitido (admin/propietario): ${firstName}`);
            continue;
          }

          // Obtener fecha de ingreso
          if ('date' in participant) {
            joinDate = new Date(participant.date * 1000);
            console.log(`📅 ${firstName} se unió al grupo el: ${joinDate.toLocaleString()}`);
          }
        }
      } catch (error) {
        console.log(`⚠️ No se pudo obtener info completa de ${firstName}, usando fecha actual`);
      }

      // Buscar si el usuario ya existe en la base de datos
      const existingUser = await User.findOne({ telegramId });

      if (existingUser) {
        // Solo actualizar información básica, NO la fecha
        existingUser.firstName = firstName;
        existingUser.lastName = lastName;
        existingUser.username = username;
        await existingUser.save();
        updated++;
        console.log(`✅ Actualizado: ${firstName} ${lastName || ''} (@${username || 'sin username'})`);
      } else {
        // Calcular cuántos días han pasado desde que ingresó al grupo
        const now = new Date();
        const daysSinceJoin = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calcular cuántos días le quedan de los 30 días
        const daysRemaining = Math.max(0, 30 - daysSinceJoin);
        
        // Calcular fecha de expiración: joinDate + 30 días (lo que corresponde)
        const expirationDate = new Date(joinDate);
        expirationDate.setDate(expirationDate.getDate() + 30);
        
        // Determinar si está activo (si le quedan días)
        const isActive = daysRemaining > 0;
        
        const newUser = new User({
          telegramId,
          firstName,
          lastName,
          username,
          registrationDate: joinDate, // Fecha real de ingreso al grupo
          paymentDurationDays: daysRemaining, // Solo los días que le quedan
          expirationDate, // Fecha calculada manualmente
          isActive,
        });
        
        // Guardar sin que el middleware modifique expirationDate
        await newUser.save();
        created++;
        console.log(`➕ Creado: ${firstName} - Ingreso: ${joinDate.toLocaleDateString()} - Días consumidos: ${daysSinceJoin} - Días restantes: ${daysRemaining} - Expira: ${newUser.expirationDate.toLocaleDateString()}`);
      }
    }

    console.log(`\n📊 Resumen de sincronización con fechas:`);
    console.log(`   ➕ Creados: ${created}`);
    console.log(`   ✅ Actualizados: ${updated}`);
    console.log(`   ⏭️  Omitidos (bots/eliminados): ${skipped}`);

    res.json({
      success: true,
      message: 'Sincronización con fechas de ingreso completada',
      stats: {
        total: users.length,
        created,
        updated,
        skipped,
      },
    });
  } catch (error: any) {
    console.error('❌ Error sincronizando usuarios del grupo:', error);
    res.status(500).json({
      error: 'Error al sincronizar usuarios',
      message: error.message,
    });
  }
};
