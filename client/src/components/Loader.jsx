import React from "react";

const SnailLoader = () => {
  return (
    <div className="h-screen flex justify-center items-center">
      <video
        src="/video/Loader.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="w-56 h-56 object-contain"
      />
    </div>
  );
};

export default SnailLoader;
