import React from 'react';
import './LoadingScreen.css'; // Styles in a separate CSS file
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const LoadingScreen = () => {
  return (
    <div className="loading-container">
      <div className="box">
        <DotLottieReact
          src="/animations/grocery-animation.lottie"
          loop
          autoplay
        />
      </div>
    </div>
  );
};

export default LoadingScreen;
