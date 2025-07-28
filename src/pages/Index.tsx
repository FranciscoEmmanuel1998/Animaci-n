import { ChaosAttractor } from "@/components/simulations/ChaosAttractor";
import { CellularAutomaton } from "@/components/simulations/CellularAutomaton";
const Index = () => {
  return (
    <div className="cosmic-canvas">
      {/* Museo Matemático-Simbólico Inmersivo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 p-6 h-screen">
        

        {/* 4. Autómata Celular Filosófico */}
        <div className="w-screen h-screen">
          <CellularAutomaton />
        </div>
      </div>
    </div>
  );
};

export default Index;