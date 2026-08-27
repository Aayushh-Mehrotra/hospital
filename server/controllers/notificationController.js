const Notification = require('../models/Notification');

// @desc    Get user notifications (filtered by role and user ID)
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  const user = req.user;
  const notifications = await Notification.find({
    $or: [
      { recipient: user._id },
      { targetRole: user.role },
      { targetRole: 'All' },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(50);

  const unreadCount = await Notification.countDocuments({
    $or: [
      { recipient: user._id },
      { targetRole: user.role },
      { targetRole: 'All' },
    ],
    isRead: false,
  });

  res.json({ success: true, count: notifications.length, unreadCount, notifications });
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  res.json({ success: true, message: 'Marked as read', notification });
};

// @desc    Mark all as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  const user = req.user;
  await Notification.updateMany(
    {
      $or: [
        { recipient: user._id },
        { targetRole: user.role },
        { targetRole: 'All' },
      ],
      isRead: false,
    },
    {
      $set: { isRead: true, readAt: new Date() },
    }
  );

  res.json({ success: true, message: 'All notifications marked as read' });
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
