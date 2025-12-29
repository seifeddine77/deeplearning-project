const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const { authMiddleware } = require('../middleware/auth');

// @route   GET /api/notifications
// @desc    Get all notifications
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const limit = req.query.limit || 50;
    const notifications = await notificationService.getNotifications(userId, Number(limit) || 50);
    
    res.json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
});

// @route   GET /api/notifications/unread
// @desc    Get unread notifications
// @access  Private
router.get('/unread', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const unreadNotifications = await notificationService.getUnreadNotifications(userId);
    
    res.json({
      success: true,
      count: unreadNotifications.length,
      notifications: unreadNotifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching unread notifications',
      error: error.message
    });
  }
});

// @route   GET /api/notifications/stats
// @desc    Get notification statistics
// @access  Private
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const stats = await notificationService.getNotificationStats(userId);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notification stats',
      error: error.message
    });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const notificationId = req.params.id;
    const success = await notificationService.markAsRead(userId, notificationId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    await notificationService.markAllAsRead(userId);
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message
    });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const notificationId = req.params.id;
    const success = await notificationService.deleteNotification(userId, notificationId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
});

// @route   POST /api/notifications/test
// @desc    Send a test notification
// @access  Private
router.post('/test', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { type, title, message, email } = req.body;
    
    let notification;
    
    switch (type) {
      case 'training_started':
        notification = notificationService.notifyTrainingStarted(title, email);
        break;
      case 'training_completed':
        notification = notificationService.notifyTrainingCompleted(title, 0.95, email);
        break;
      case 'training_error':
        notification = notificationService.notifyTrainingError(title, message, email);
        break;
      case 'warning':
        notification = notificationService.notifyWarning(title, message);
        break;
      case 'error':
        notification = notificationService.notifySystemError(title, message);
        break;
      default:
        notification = await notificationService.addNotification(userId, type, title, message);
    }
    
    res.json({
      success: true,
      message: 'Test notification sent',
      notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending test notification',
      error: error.message
    });
  }
});

module.exports = router;
