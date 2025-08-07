import EnhancedCombinedSimulation from "@/components/simulations/EnhancedCombinedSimulation";
import { useState, useRef, useEffect } from "react";

const Index = () => {
  const [showInfo, setShowInfo] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  const [simulationKey, setSimulationKey] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const resetSimulation = () => {
    setSimulationKey(prev => prev + 1);
  };

  // Función para inicializar audio de manera agresiva
  const forceInitializeAudio = async () => {
    if (audioRef.current && !audioInitialized) {
      try {
        audioRef.current.volume = isMuted ? 0 : 0.3;
        audioRef.current.muted = false;
        await audioRef.current.play();
        setAudioInitialized(true);
        console.log("✅ Audio inicializado exitosamente");
      } catch (error) {
        console.log("❌ Error al inicializar audio:", error);
      }
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        // Reactivar audio
        audioRef.current.volume = 0.3;
        if (audioRef.current.paused) {
          audioRef.current.play().catch(() => {
            console.log("Error al reproducir audio");
          });
        }
      } else {
        // Silenciar audio (pero no pausar)
        audioRef.current.volume = 0;
      }
      setIsMuted(!isMuted);
    }
  };

  // Efecto para manejar el audio al montar el componente - SOLO PREPARAR, NO REPRODUCIR
  useEffect(() => {
    const initializeAudio = async () => {
      if (audioRef.current) {
        console.log("🎵 Preparando audio para después del Big Bang...");
        
        // Configuración inicial - SIN reproducir automáticamente
        audioRef.current.volume = isMuted ? 0 : 0.3;
        audioRef.current.loop = true;
        audioRef.current.autoplay = false; // NO autoplay - esperar evento
        
        // Solo preparar el audio, no reproducir
        try {
          audioRef.current.load(); // Precargar el audio
          console.log("✅ Audio precargado, esperando Big Bang");
        } catch (error) {
          console.log("❌ Error precargando audio:", error);
        }
      }
    };

    // Solo preparar una vez
    initializeAudio();
  }, [simulationKey]);

  // Efecto separado para manejar cambios de mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3
    }

    // 🎵 ESCUCHAR EVENTO PARA INICIAR MÚSICA DESPUÉS DEL BIG BANG
    const handleStartMusic = async () => {
      if (audioRef.current && !isMuted) {
        try {
          audioRef.current.currentTime = 0
          await audioRef.current.play()
          setAudioInitialized(true)
          console.log('🎵 Música de fondo iniciada después del Big Bang')
        } catch (error) {
          console.log('Error iniciando música:', error)
        }
      }
    }

    window.addEventListener('startBackgroundMusic', handleStartMusic)
    
    return () => {
      window.removeEventListener('startBackgroundMusic', handleStartMusic)
    }
  }, [isMuted])

  return (
    <div className="cosmic-canvas w-screen h-screen overflow-hidden relative bg-black">
      {/* TU ANIMACIÓN DORADA INTOCABLE - BACKGROUND COMPLETO */}
      <div className="absolute inset-0 z-0">
        <EnhancedCombinedSimulation key={simulationKey} />
      </div>

      {/* OVERLAY PROFESIONAL - NO INTERFIERE CON LA ANIMACIÓN */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        
        {/* HEADER DISCRETO */}
        <div className="absolute top-6 left-6 pointer-events-auto flex space-x-3">
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className="px-4 py-2 bg-black/30 backdrop-blur-sm border border-amber-500/20 
                       text-amber-300 text-sm font-mono rounded-md hover:bg-black/50 
                       transition-all duration-300 hover:border-amber-400/40"
          >
            {showInfo ? '◉ INFO' : '○ INFO'}
          </button>
          
          <button 
            onClick={() => setShowExplanation(!showExplanation)}
            className="px-4 py-2 bg-black/30 backdrop-blur-sm border border-amber-500/20 
                       text-amber-300 text-sm font-mono rounded-md hover:bg-black/50 
                       transition-all duration-300 hover:border-amber-400/40"
          >
            {showExplanation ? '◉ ¿QUÉ VES?' : '○ ¿QUÉ VES?'}
          </button>
        </div>

        {/* INFORMACIÓN PROFESIONAL - OVERLAY ELEGANTE */}
        {showInfo && (
          <div className="absolute top-6 right-6 max-w-md pointer-events-auto
                          bg-black/40 backdrop-blur-lg border border-amber-500/20 
                          rounded-lg p-6 shadow-2xl">
            
            {/* GLOW EFFECT MATCHING YOUR ANIMATION */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 
                            rounded-lg blur-xl"></div>
            
            <div className="relative z-10">
              {/* NOMBRE PRINCIPAL */}
              <h1 className="text-2xl font-bold text-amber-300 mb-2 
                             drop-shadow-lg font-mono tracking-wide">
                Francisco Emmanuel
                <br />
                <span className="text-amber-400">Arias López</span>
              </h1>
              
              {/* TÍTULO PROFESIONAL */}
              <div className="mb-4 space-y-1">
                <p className="text-amber-200 font-semibold text-lg">
                  Licenciado en Multimedia
                </p>
                <p className="text-amber-200 font-semibold">
                  y Animación Digital
                </p>
              </div>
              
              {/* INSTITUCIÓN */}
              <div className="mb-6 pb-4 border-b border-amber-500/20">
                <p className="text-amber-300/80 text-sm font-mono">
                  Facultad de Ciencias
                  <br />
                  Físico Matemáticas
                </p>
              </div>
              
              {/* DESCRIPCIÓN TÉCNICA */}
              <div className="space-y-2 text-xs text-amber-200/70 font-mono">
                <p>🧬 Conway's Game of Life</p>
                <p>🌌 Lorenz Attractor System</p>
                <p>⚡ Real-time Particle Physics</p>
                <p>🎨 Procedural Color Synthesis</p>
              </div>
            </div>
          </div>
        )}

        {/* PANEL EDUCATIVO - EXPLICACIÓN PARA VISITANTES */}
        {showExplanation && (
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 max-w-4xl pointer-events-auto
                          bg-black/50 backdrop-blur-lg border border-amber-500/25 
                          rounded-lg p-8 shadow-2xl max-h-[80vh] overflow-y-auto">
            
            {/* GLOW EFFECT */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/8 to-orange-500/8 
                            rounded-lg blur-xl"></div>
            
            <div className="relative z-10">
              {/* TÍTULO PRINCIPAL */}
              <h1 className="text-3xl font-bold text-amber-300 mb-6 text-center
                             drop-shadow-lg font-mono tracking-wide">
                🌌 ¿Qué estás viendo? 🌌
              </h1>
              
              <div className="space-y-6 text-amber-200">
                
                {/* CONWAY'S GAME OF LIFE */}
                <div className="bg-black/20 rounded-lg p-4 border border-amber-500/10">
                  <h2 className="text-xl font-bold text-amber-300 mb-3 flex items-center">
                    🧬 El Juego de la Vida de Conway
                  </h2>
                  <div className="space-y-2 text-sm">
                    <p><strong className="text-amber-400">¿Qué es?</strong> El Juego de la Vida de Conway (Conway's Game of Life) es un autómata celular creado por el matemático británico John Horton Conway en 1970. A pesar de su nombre, no es un juego en el sentido tradicional, sino una simulación matemática que ilustra cómo comportamientos complejos pueden emerger de reglas simples aplicadas a sistemas distribuidos.</p>
                    <p><strong className="text-amber-400">¿Cómo funciona?</strong>El universo del Juego de la Vida es una rejilla bidimensional (matriz) compuesta por celdas, cada una de las cuales puede estar en uno de dos estados:

Viva (1)

Muerta (0)

Cada celda interactúa con sus 8 vecinas adyacentes (horizontal, vertical y diagonal). En cada iteración, el estado de todas las celdas se actualiza simultáneamente según estas reglas simples:</p>
                    <p><strong className="text-amber-400">⚙️ Reglas del juego</strong> Supervivencia:
Una célula viva con 2 o 3 vecinas vivas sobrevive.

Muerte por soledad:
Una célula viva con menos de 2 vecinas vivas muere.

Muerte por sobrepoblación:
Una célula viva con más de 3 vecinas vivas muere.

Nacimiento:
Una célula muerta con exactamente 3 vecinas vivas revive.

</p>
                    <p><strong className="text-amber-400">¿Por qué es fascinante?</strong> El Juego de la Vida de Conway es fascinante porque demuestra cómo reglas extremadamente simples pueden generar comportamientos increíblemente complejos y sorprendentes</p>
                  </div>
                </div>

                {/* LORENZ ATTRACTOR */}
                <div className="bg-black/20 rounded-lg p-4 border border-amber-500/10">
                  <h2 className="text-xl font-bold text-amber-300 mb-3 flex items-center">
                    🌌 Sistema de Atractor de Lorenz
                  </h2>
                  <div className="space-y-2 text-sm">
                    <p><strong className="text-amber-400">¿Qué es?</strong> Es un conjunto de ecuaciones diferenciales no lineales que modelan el comportamiento caótico de ciertos sistemas dinámicos, como la atmósfera. Fue formulado por Edward Lorenz en 1963 y se convirtió en uno de los primeros ejemplos del caos determinista.</p>
                    <p><strong className="text-amber-400">En esta animación:</strong> el Atractor de Lorenz puede representarse como una hermosa animación espiral tridimensional, pero no es una espiral simple o regular:
es una espiral doble caótica, donde las trayectorias giran alrededor de dos lóbulos de forma aparentemente ordenada, pero nunca se repiten ni se cierran.</p>
<p><strong className="text-amber-400">📊 Las matemáticas:</strong> El Sistema de Lorenz se basa en tres ecuaciones diferenciales no lineales que crean patrones infinitos.
𝑑𝑥/𝑑𝑡 =𝜎(𝑦−𝑥),  𝑑𝑦/𝑑𝑡 =𝑥(𝜌−𝑧)−𝑦, 𝑑𝑧/𝑑𝑡 =𝑥𝑦−β𝑧</p>
                    <p><strong className="text-amber-400">¿Por qué es hermoso?</strong> es hermoso porque combina caos y orden en una estructura fluida y simétrica. Su forma, parecida a unas alas de mariposa, revela una danza infinita de trayectorias que nunca se cruzan, pero tampoco escapan ni se repiten.</p>
                  </div>
                </div>

                {/* PARTICLE PHYSICS */}
                <div className="bg-black/20 rounded-lg p-4 border border-amber-500/10">
                  <h2 className="text-xl font-bold text-amber-300 mb-3 flex items-center">
                    ⚡ Física de Partículas en Tiempo Real
                  </h2>
                  <div className="space-y-2 text-sm">
                    <p><strong className="text-amber-400">¿Qué son?</strong> Las pequeñas luces que emergen de las células vivas y viajan hacia el atractor. Representa una simulación visual y algorítmica en la que partículas virtuales —como células, nodos energéticos o trayectorias del atractor de Lorenz— evolucionan dinámicamente según principios físicos simplificados, renderizadas en animaciones sincronizadas con frecuencia, energía y pulsos cósmicos.</p>
                    <p><strong className="text-amber-400">📡En esta animación:</strong> Son entidades visuales dinámicas que emulan materia y energía en evolución, modeladas con lógica de sistemas complejos, autómatas celulares y atractores caóticos. Una especie de “microfísica visual simbiótica” generada en tiempo real.</p>

                    <p><strong className="text-amber-400">El efecto:</strong> Ambos sistemas parecen "hablar" entre sí, creando una sinfonía visual</p>
                  </div>
                </div>

                {/* PROCEDURAL COLORS */}
                <div className="bg-black/20 rounded-lg p-4 border border-amber-500/10">
                  <h2 className="text-xl font-bold text-amber-300 mb-3 flex items-center">
                    🎨 Síntesis de Color Procedimental
                  </h2>
                  <div className="space-y-2 text-sm">
                    <p><strong className="text-amber-400">¿Qué significa?</strong> Significa crear colores automáticamente mediante algoritmos, usando fórmulas en lugar de elegir colores manualmente.</p>
                    <p><strong className="text-amber-400">🪄 En esta animación:</strong> Ocurre una coreografía cósmica algorítmica, donde múltiples sistemas interactúan simultáneamente en una danza de lógica, caos y energía visual.</p>

                    <p><strong className="text-amber-400">El resultado:</strong> Una paleta que evoluciona orgánicamente con el comportamiento del sistema</p>
                  </div>
                </div>

               

              </div>
              
              {/* MENSAJE FINAL */}
              <div className="mt-6 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <p className="text-center text-amber-300 text-sm font-mono">
                  ✨ Esta es una demostración de cómo las matemáticas pueden crear belleza ✨
                  <br />
                  <span className="text-amber-400">Cada frame es calculado en tiempo real - ¡No hay videos ni animaciones pregrabadas!</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER TÉCNICO */}
        <div className="absolute bottom-6 left-6 pointer-events-auto">
          <div className="flex space-x-4 text-xs font-mono text-amber-400/60">
            <span>React + TypeScript</span>
            <span>•</span>
            <span>HTML5 Canvas</span>
            <span>•</span>
            <span>Mathematical Modeling</span>
          </div>
        </div>

        {/* CONTROLES - REINICIO Y AUDIO */}
        <div className="absolute bottom-6 right-6 pointer-events-auto flex space-x-3">
          <button 
            onClick={toggleMute}
            className="w-12 h-12 bg-black/30 backdrop-blur-sm border border-amber-500/20 
                       text-amber-300 rounded-full hover:bg-black/50 transition-all duration-300 
                       flex items-center justify-center text-lg hover:scale-110 hover:border-amber-400/40
                       hover:text-amber-200"
            title={isMuted ? "Activar Audio" : "Silenciar Audio"}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          
          <button 
            onClick={resetSimulation}
            className="w-12 h-12 bg-black/30 backdrop-blur-sm border border-amber-500/20 
                       text-amber-300 rounded-full hover:bg-black/50 transition-all duration-300 
                       flex items-center justify-center text-lg hover:scale-110 hover:border-amber-400/40
                       hover:text-amber-200"
            title="Reiniciar Simulación"
          >
            ⟲
          </button>
        </div>
        
        {/* ELEMENTO DE AUDIO PARA MÚSICA DE FONDO */}
                <audio
          ref={audioRef}
          loop
          preload="auto"
          muted={isMuted}
          onCanPlayThrough={() => {
            console.log("Audio listo para reproducir - esperando Big Bang");
          }}
          onLoadedData={() => {
            // Configuración para loop seamless
            if (audioRef.current) {
              // Detectar casi el final del audio y hacer loop manual
              audioRef.current.addEventListener('timeupdate', () => {
                if (audioRef.current) {
                  // Loop cuando quedan 30ms para terminar
                  if (audioRef.current.currentTime >= audioRef.current.duration - 0.03) {
                    audioRef.current.currentTime = 0.01; // Pequeño offset para evitar clicks
                  }
                }
              });
            }
          }}
          onPlay={() => {
            console.log("🎵 Música de fondo iniciada después del Big Bang");
            setAudioInitialized(true);
          }}
          onPause={() => {
            console.log("Audio pausado");
          }}
          onError={(e) => {
            console.log("Error cargando audio:", e);
          }}
        >
          <source src="/FREQUENCY.mp3" type="audio/mpeg" />
          Tu navegador no soporta audio HTML5.
        </audio>
      </div>
    </div>
  );
};

export default Index;