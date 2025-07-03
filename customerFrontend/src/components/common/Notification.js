import React from "react";
import "./Notification.css";

const Notification = ({ message, type, onClose }) => {
  if (!message) return null;

  return (
    <div className={`notification ${type ? 'success' : 'error'}`}>
      <div id="mitem">
        <p>{message}</p>
      </div>
      <div id="mitem">
        <button class="noticlose" onClick={onClose}>✖</button>
      </div>
    </div>
  );
};

export default Notification;
