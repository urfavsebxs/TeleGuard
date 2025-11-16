import cron from 'node-cron';
import { User } from '../models/User.model';
import { kickUserFromGroup, notifyExpiration } from './telegram.service';

export const checkExpiredUsers = async (): Promise<void> => {
  try {
    console.log('🔍 Verificando usuarios expirados...');

    // Encontrar usuarios expirados que aún están activos
    const expiredUsers = await User.find({
      isActive: true,
      expirationDate: { $lte: new Date() },
    });

    console.log(`📊 Usuarios expirados encontrados: ${expiredUsers.length}`);

    for (const user of expiredUsers) {
      console.log(`⏰ Procesando usuario expirado: ${user.firstName} (${user.telegramId})`);

      // Primero notificar antes de expulsar
      await notifyExpiration(user.telegramId, user.firstName, 0);

      // Luego expulsar del grupo
      const kicked = await kickUserFromGroup(user.telegramId);

      if (kicked) {
        // Marcar como inactivo
        user.isActive = false;
        await user.save();
        console.log(`✅ Usuario ${user.telegramId} marcado como inactivo`);
      }
    }

    console.log('✅ Verificación de usuarios expirados completada');
  } catch (error) {
    console.error('❌ Error al verificar usuarios expirados:', error);
  }
};

export const checkExpiringUsers = async (): Promise<void> => {
  try {
    const today = new Date();
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);

    const oneDayLater = new Date(today);
    oneDayLater.setDate(today.getDate() + 1);

    // Usuarios que expiran en 3 días
    const usersExpiring3Days = await User.find({
      isActive: true,
      expirationDate: {
        $gte: threeDaysLater,
        $lt: new Date(threeDaysLater.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    for (const user of usersExpiring3Days) {
      await notifyExpiration(user.telegramId, user.firstName, 3);
    }

    // Usuarios que expiran en 1 día
    const usersExpiring1Day = await User.find({
      isActive: true,
      expirationDate: {
        $gte: oneDayLater,
        $lt: new Date(oneDayLater.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    for (const user of usersExpiring1Day) {
      await notifyExpiration(user.telegramId, user.firstName, 1);
    }

    console.log(`📢 Notificaciones enviadas: ${usersExpiring3Days.length + usersExpiring1Day.length}`);
  } catch (error) {
    console.error('❌ Error al verificar usuarios próximos a expirar:', error);
  }
};

export const startCronJob = (): void => {
  const checkIntervalHours = parseInt(process.env.CHECK_INTERVAL_HOURS || '6');

  // Verificar usuarios expirados cada X horas
  const cronExpression = `0 */${checkIntervalHours} * * *`;
  
  cron.schedule(cronExpression, async () => {
    console.log(`\n⏰ Ejecutando verificación programada - ${new Date().toISOString()}`);
    await checkExpiredUsers();
    await checkExpiringUsers();
  });

  console.log(`✅ Cron job programado: cada ${checkIntervalHours} horas`);

  // Ejecutar verificación inicial
  setTimeout(() => {
    checkExpiredUsers();
    checkExpiringUsers();
  }, 5000);
};
