
import React from "react";

const LoginBackground = () => {
  return (
    <div className="absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-100/90 via-blue-50/90 to-green-100/90" />
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1587854692152-cbe660dbde88?q=80&w=2069')`
        }}
      />
    </div>
  );
};

export default LoginBackground;
