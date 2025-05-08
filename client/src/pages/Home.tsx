import React from "react";
import TankaCounter from "@/components/TankaCounter";

const Home: React.FC = () => {
  return (
    <div className="bg-background min-h-screen flex flex-col items-center py-8 px-0 font-sans md:px-4">
      <TankaCounter />
    </div>
  );
};

export default Home;
