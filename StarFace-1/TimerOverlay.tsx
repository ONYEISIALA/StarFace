import React from 'react';

const TimerOverlay: React.FC = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      color: 'white',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      flexDirection: 'column'
    }}>
      <h1>⏳ Time's Up!</h1>
      <p>Your daily screen time has ended. Please come back tomorrow or ask a parent to reset your timer.</p>
    </div>
  );
};

export default TimerOverlay;
