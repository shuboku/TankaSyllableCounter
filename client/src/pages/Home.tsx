import React from "react";
import TankaCounter from "@/components/TankaCounter";

const Home: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center py-8 px-4 sm:px-6 font-sans">
      <TankaCounter />
    </div>
  );
};

export default Home;
