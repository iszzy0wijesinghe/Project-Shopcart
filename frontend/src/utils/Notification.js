import React from "react";
import "./Notification.css";

const Notification = ({ message, type, onClose }) => {
  if (!message) return null;

  return (
    <div className={`notification ${type}`}>
        <div className="mitem">
      <p>{message}</p></div>
      <div className="mitem">
      <button onClick={onClose}>X</button></div>
    </div>
  );
};

export default Notification;
