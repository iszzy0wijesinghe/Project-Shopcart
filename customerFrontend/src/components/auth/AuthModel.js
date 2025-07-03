import { useState, useEffect } from 'react';
import Login from './Login';
import Signup from './Signup';
import './Auth.css';

const AuthModal = ({ isOpen, onClose, initialMode}) => {
  const [mode, setMode] = useState(initialMode);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    // Clean up in case modal unmounts
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>

        {/* <div className="modal-header">
          <button className="close-button" onClick={onClose}>✕</button>
        </div> */}

        {mode === 'login' ? (
          <Login 
            isPopup={true} 
            onClose={onClose} 
            switchMode={() => setMode('signup')} 
          />
        ) : (
          <Signup 
            isPopup={true} 
            onClose={onClose} 
            switchMode={() => setMode('login')} 
          />
        )}
      </div>
    </div>
  );
};

export default AuthModal;