import React from "react";

function Notifications(notifications) {
  return (
    <div id="notifications">
      {notifications.map((notification, index) => (
        <div key={index}>New Order Placed: {notification.name}</div>
      ))}
    </div>
  );
}

export default Notifications;
