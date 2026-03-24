// src/components/NotificationBanner.jsx
const NotificationBanner = ({ notifications }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {notifications.map((notification) => {
        const bgColor =
          notification.type === "critical"
            ? "bg-red-50 border-red-200"
            : "bg-yellow-50 border-yellow-200";

        const textColor =
          notification.type === "critical" ? "text-red-800" : "text-yellow-800";

        const icon = notification.type === "critical" ? "⚠️" : "⚡";

        return (
          <div
            key={notification.id}
            className={`${bgColor} border rounded-lg p-4`}
          >
            <div className="flex items-start">
              <span className="text-2xl mr-3">{icon}</span>
              <div className="flex-1">
                <h4 className={`${textColor} font-semibold text-sm`}>
                  {notification.title}
                </h4>
                <p className={`${textColor} text-sm mt-1`}>
                  {notification.message}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationBanner;
