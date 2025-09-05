import { useState, useRef, useEffect } from 'react'
import EnhancedCombinedSimulation from '../components/simulations/EnhancedCombinedSimulation'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Volume2, VolumeX, Play, Pause, RotateCcw, Info } from 'lucide-react'

const Index = () => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showStartPrompt, setShowStartPrompt] = useState(true)
  const [showInfo, setShowInfo] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.volume = 0.3
    }
  }, [])

  const handleStartExperience = async () => {
    setShowStartPrompt(false)
    setIsAudioEnabled(true)
    
    if (backgroundAudioRef.current) {
      try {
        await backgroundAudioRef.current.play()
        setIsPlaying(true)
      } catch (error) {
        console.log('Audio will start on next user interaction')
      }
    }
  }

  const toggleAudio = async () => {
    if (!backgroundAudioRef.current) return

    if (isPlaying) {
      backgroundAudioRef.current.pause()
      setIsPlaying(false)
    } else {
      try {
        await backgroundAudioRef.current.play()
        setIsPlaying(true)
      } catch (error) {
        console.error('Audio play failed:', error)
      }
    }
  }

  const resetSimulation = () => {
    window.location.reload()
  }

  // Pantalla de inicio elegante
  if (showStartPrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Estrellas de fondo */}
        <div className="absolute inset-0">
          {Array.from({ length: 100 }, (_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <Card className="w-full max-w-md mx-4 bg-black/50 border-purple-500/30 backdrop-blur-sm relative z-10">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-purple-200 mb-2">🌌 Cosmic Evolution</CardTitle>
            <p className="text-purple-300 text-sm">Una simulación interactiva del universo</p>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-2">
              <p className="text-purple-100">
                Experimenta el nacimiento del universo con efectos visuales y sonido inmersivo
              </p>
              <p className="text-purple-300 text-xs">
                Incluye: Big Bang, Autómata Celular de Conway, Atractor de Lorenz
              </p>
            </div>
            <Button 
              onClick={handleStartExperience}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white transition-all duration-300 transform hover:scale-105"
              size="lg"
            >
              <Play className="mr-2 h-5 w-5" />
              Iniciar Experiencia Cósmica
            </Button>
            <p className="text-purple-400 text-xs">
              🔊 Para mejor experiencia, usa auriculares
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Audio background */}
      <audio
        ref={backgroundAudioRef}
        src="/FREQUENCY.mp3"
        loop
        preload="auto"
      />

      {/* Controles flotantes */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowInfo(!showInfo)}
          className="bg-black/50 border-purple-500/30 text-purple-200 hover:bg-purple-900/30"
        >
          <Info className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={toggleAudio}
          className="bg-black/50 border-purple-500/30 text-purple-200 hover:bg-purple-900/30"
        >
          {isPlaying ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={resetSimulation}
          className="bg-black/50 border-purple-500/30 text-purple-200 hover:bg-purple-900/30"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Panel de información profesional */}
      {showInfo && (
        <div className="absolute top-4 right-4 z-20 w-80">
          <Card className="bg-black/80 border-purple-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-purple-200 text-lg">Francisco Torreblanca</CardTitle>
              <p className="text-purple-300 text-sm">Desarrollador Full Stack & Científico de Datos</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-purple-100 text-sm space-y-2">
                <p><strong className="text-purple-300">Especialidades:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>React, TypeScript, Python</li>
                  <li>Machine Learning & AI</li>
                  <li>Visualización de Datos</li>
                  <li>Simulaciones Matemáticas</li>
                </ul>
                
                <p className="pt-2"><strong className="text-purple-300">Esta simulación:</strong></p>
                <p className="text-xs">
                  Combina matemáticas complejas, física de partículas y programación creativa 
                  para mostrar la evolución cósmica desde el Big Bang hasta sistemas complejos.
                </p>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExplanation(!showExplanation)}
                className="w-full bg-purple-900/30 border-purple-500/30 text-purple-200 hover:bg-purple-800/40"
              >
                {showExplanation ? 'Ocultar' : 'Ver'} Explicación Técnica
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Panel educativo */}
      {showExplanation && (
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <Card className="bg-black/80 border-purple-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-purple-200 text-lg">🧬 Ciencia detrás de la Simulación</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="text-purple-300 font-semibold">💥 Big Bang</h4>
                <p className="text-purple-100 text-xs">
                  Expansión exponencial del espacio-tiempo desde un punto singular. 
                  Representa el nacimiento de toda la materia y energía del universo.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-purple-300 font-semibold">🔲 Autómata Celular</h4>
                <p className="text-purple-100 text-xs">
                  Juego de la Vida de Conway: sistema donde células evolucionan según reglas simples, 
                  mostrando cómo la complejidad emerge de la simplicidad.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-purple-300 font-semibold">🌪️ Atractor de Lorenz</h4>
                <p className="text-purple-100 text-xs">
                  Sistema caótico que modela la convección atmosférica. Demuestra cómo 
                  pequeños cambios pueden tener efectos dramáticos (efecto mariposa).
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Simulación principal */}
      <EnhancedCombinedSimulation key={0} />
    </div>
  )
}

export default Index
