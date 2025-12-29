const nodemailer = require('nodemailer');
const logger = require('../config/logger');
let Notification;
try {
  Notification = require('../models/Notification');
} catch (e) {
  Notification = null;
}

class NotificationService {
  constructor() {
    this.transporter = null;

    // Notifications en mémoire (pour les notifications en temps réel)
    this.notifications = [];
    this.maxNotifications = 100;
  }

  isMongoAvailable() {
    return !!Notification;
  }

  /**
   * Envoyer une notification par email
   */
  async sendEmailNotification(to, subject, message, htmlContent = null) {
    try {
      const host = process.env.SMTP_HOST;
      const port = Number(process.env.SMTP_PORT || 587);
      const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;
      const from = process.env.EMAIL_FROM || user;

      if (!host || !user || !pass) {
        return { success: false, error: 'SMTP not configured (SMTP_HOST/SMTP_USER/SMTP_PASS required)' };
      }

      if (!this.transporter) {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass }
        });
      }

      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        text: message,
        ...(htmlContent ? { html: htmlContent } : {})
      });

      logger.info({
        message: 'Email notification sent',
        to,
        subject,
        messageId: info?.messageId
      });

      return { success: true, messageId: info?.messageId || null };
    } catch (error) {
      logger.error({
        message: 'Failed to send email notification',
        to,
        subject,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Ajouter une notification en mémoire
   */
  async addNotification(userIdOrType, typeOrTitle, titleOrMessage, messageOrData, maybeData = {}) {
    // Backward compatible:
    // - addNotification(type, title, message, data)
    // - addNotification(userId, type, title, message, data)
    let userId = null;
    let type;
    let title;
    let message;
    let data;

    if (typeof userIdOrType === 'string' && ['success', 'error', 'warning', 'info'].includes(userIdOrType)) {
      type = userIdOrType;
      title = typeOrTitle;
      message = titleOrMessage;
      data = messageOrData || {};
    } else {
      userId = userIdOrType || null;
      type = typeOrTitle;
      title = titleOrMessage;
      message = messageOrData;
      data = maybeData || {};
    }

    const notification = {
      id: Date.now(),
      type,
      title,
      message,
      data,
      timestamp: new Date(),
      read: false
    };

    // Persist to Mongo if possible
    try {
      if (this.isMongoAvailable() && userId) {
        const doc = await Notification.create({
          userId,
          type,
          title,
          message,
          data,
          read: false
        });
        logger.info({
          message: 'Notification added (mongo)',
          type,
          title,
          notificationId: String(doc._id)
        });
        return {
          id: String(doc._id),
          type: doc.type,
          title: doc.title,
          message: doc.message,
          data: doc.data,
          timestamp: doc.createdAt,
          read: doc.read
        };
      }
    } catch (e) {
      // fallback to memory
    }

    this.notifications.unshift(notification);

    if (this.notifications.length > this.maxNotifications) {
      this.notifications.pop();
    }

    logger.info({
      message: 'Notification added (memory)',
      type,
      title,
      notificationId: notification.id
    });

    return notification;
  }

  /**
   * Obtenir toutes les notifications
   */
  async getNotifications(userId = null, limit = 50) {
    try {
      if (this.isMongoAvailable() && userId) {
        const docs = await Notification.find({ userId })
          .sort({ createdAt: -1 })
          .limit(Number(limit) || 50)
          .lean();

        return (docs || []).map((d) => ({
          id: String(d._id),
          type: d.type,
          title: d.title,
          message: d.message,
          data: d.data,
          timestamp: d.createdAt,
          read: d.read
        }));
      }
    } catch (e) {
      // ignore and fallback
    }

    return this.notifications.slice(0, Number(limit) || 50);
  }

  /**
   * Obtenir les notifications non lues
   */
  async getUnreadNotifications(userId = null) {
    try {
      if (this.isMongoAvailable() && userId) {
        const docs = await Notification.find({ userId, read: false })
          .sort({ createdAt: -1 })
          .lean();
        return (docs || []).map((d) => ({
          id: String(d._id),
          type: d.type,
          title: d.title,
          message: d.message,
          data: d.data,
          timestamp: d.createdAt,
          read: d.read
        }));
      }
    } catch (e) {
      // ignore
    }
    return this.notifications.filter(n => !n.read);
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(userId, notificationId) {
    try {
      if (this.isMongoAvailable() && userId && notificationId) {
        const updated = await Notification.updateOne(
          { _id: notificationId, userId },
          { $set: { read: true } }
        );
        if (updated?.matchedCount) return true;
      }
    } catch (e) {
      // ignore
    }

    const nId = Number(notificationId);
    const notification = this.notifications.find(n => n.id === nId);
    if (notification) {
      notification.read = true;
      return true;
    }
    return false;
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(userId = null) {
    try {
      if (this.isMongoAvailable() && userId) {
        await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
        return;
      }
    } catch (e) {
      // ignore
    }
    this.notifications.forEach(n => n.read = true);
  }

  /**
   * Supprimer une notification
   */
  async deleteNotification(userId, notificationId) {
    try {
      if (this.isMongoAvailable() && userId && notificationId) {
        const deleted = await Notification.deleteOne({ _id: notificationId, userId });
        if (deleted?.deletedCount) return true;
      }
    } catch (e) {
      // ignore
    }

    const nId = Number(notificationId);
    const index = this.notifications.findIndex(n => n.id === nId);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Envoyer une notification d'entraînement
   */
  notifyTrainingStarted(modelName, userEmail) {
    const notification = this.addNotification(
      'info',
      'Training Started',
      `Model "${modelName}" training has started`,
      { modelName, type: 'training_started' }
    );

    if (userEmail) {
      this.sendEmailNotification(
        userEmail,
        'Training Started',
        `Your model "${modelName}" has started training.`,
        `<h2>Training Started</h2><p>Your model "<strong>${modelName}</strong>" has started training.</p>`
      );
    }

    return notification;
  }

  /**
   * Envoyer une notification d'entraînement terminé
   */
  notifyTrainingCompleted(modelName, accuracy, userEmail) {
    const notification = this.addNotification(
      'success',
      'Training Completed',
      `Model "${modelName}" training completed with ${(accuracy * 100).toFixed(2)}% accuracy`,
      { modelName, accuracy, type: 'training_completed' }
    );

    if (userEmail) {
      this.sendEmailNotification(
        userEmail,
        'Training Completed',
        `Your model "${modelName}" has finished training with ${(accuracy * 100).toFixed(2)}% accuracy.`,
        `<h2>Training Completed</h2><p>Your model "<strong>${modelName}</strong>" has finished training.</p><p><strong>Accuracy:</strong> ${(accuracy * 100).toFixed(2)}%</p>`
      );
    }

    return notification;
  }

  /**
   * Envoyer une notification d'erreur d'entraînement
   */
  notifyTrainingError(modelName, error, userEmail) {
    const notification = this.addNotification(
      'error',
      'Training Error',
      `Model "${modelName}" training failed: ${error}`,
      { modelName, error, type: 'training_error' }
    );

    if (userEmail) {
      this.sendEmailNotification(
        userEmail,
        'Training Error',
        `Your model "${modelName}" training failed: ${error}`,
        `<h2>Training Error</h2><p>Your model "<strong>${modelName}</strong>" training failed.</p><p><strong>Error:</strong> ${error}</p>`
      );
    }

    return notification;
  }

  /**
   * Envoyer une notification de prédiction
   */
  notifyPredictionMade(modelName, confidence) {
    return this.addNotification(
      'info',
      'Prediction Made',
      `Prediction made with ${(confidence * 100).toFixed(2)}% confidence`,
      { modelName, confidence, type: 'prediction_made' }
    );
  }

  /**
   * Envoyer une notification d'erreur système
   */
  notifySystemError(title, message) {
    return this.addNotification(
      'error',
      title,
      message,
      { type: 'system_error' }
    );
  }

  /**
   * Envoyer une notification d'avertissement
   */
  notifyWarning(title, message) {
    return this.addNotification(
      'warning',
      title,
      message,
      { type: 'warning' }
    );
  }

  /**
   * Obtenir les statistiques des notifications
   */
  async getNotificationStats(userId = null) {
    try {
      if (this.isMongoAvailable() && userId) {
        const [total, unread, success, error, warning, info] = await Promise.all([
          Notification.countDocuments({ userId }),
          Notification.countDocuments({ userId, read: false }),
          Notification.countDocuments({ userId, type: 'success' }),
          Notification.countDocuments({ userId, type: 'error' }),
          Notification.countDocuments({ userId, type: 'warning' }),
          Notification.countDocuments({ userId, type: 'info' })
        ]);

        return {
          total,
          unread,
          byType: { success, error, warning, info }
        };
      }
    } catch (e) {
      // ignore
    }

    return {
      total: this.notifications.length,
      unread: this.notifications.filter(n => !n.read).length,
      byType: {
        success: this.notifications.filter(n => n.type === 'success').length,
        error: this.notifications.filter(n => n.type === 'error').length,
        warning: this.notifications.filter(n => n.type === 'warning').length,
        info: this.notifications.filter(n => n.type === 'info').length
      }
    };
  }
}

// Exporter une instance unique
module.exports = new NotificationService();
