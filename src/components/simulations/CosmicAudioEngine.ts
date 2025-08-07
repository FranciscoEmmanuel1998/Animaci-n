// Sistema de Audio Procedural Cósmico
export class CosmicAudioEngine {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private oscillators: Map<string, OscillatorNode> = new Map()
  private isInitialized = false
  private cosmicFrequencies: number[] = []
  
  constructor() {
    this.initializeAudio()
  }

  private async initializeAudio() {
    try {
      this.audioContext = new AudioContext()
      this.masterGain = this.audioContext.createGain()
      this.analyser = this.audioContext.createAnalyser()
      
      this.masterGain.connect(this.analyser)
      this.analyser.connect(this.audioContext.destination)
      
      // Volumen inicial bajo
      this.masterGain.gain.setValueAtTime(0.1, this.audioContext.currentTime)
      
      this.isInitialized = true
    } catch (error) {
      console.warn('Audio context not available:', error)
    }
  }

  // Convierte actividad celular en música
  public generateCellularHarmony(cellularGrid: number[][], generation: number) {
    if (!this.isInitialized || !this.audioContext || !this.masterGain) return

    const activeCells = cellularGrid.flat().filter(cell => cell === 1).length
    const totalCells = cellularGrid.flat().length
    const density = activeCells / totalCells

    // Frecuencias base basadas en la densidad celular
    const baseFrequency = 55 + (density * 220) // Entre 55Hz y 275Hz
    
    // Escalas musicales cósmicas
    const cosmicScale = [1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8] // Escala natural
    const frequencies = cosmicScale.map(ratio => baseFrequency * ratio)
    
    // Actualizar frecuencias cósmicas
    this.cosmicFrequencies = frequencies

    // Crear acordes basados en patrones celulares
    this.createCellularChord(frequencies, density, generation)
  }

  private createCellularChord(frequencies: number[], density: number, generation: number) {
    if (!this.audioContext || !this.masterGain) return

    // Limpiar osciladores anteriores
    this.cleanupOscillators()

    const now = this.audioContext.currentTime
    const duration = 0.5 // Duración de cada acorde

    frequencies.forEach((freq, index) => {
      if (density > 0.1 && Math.random() < density * 2) { // Probabilidad basada en densidad
        const oscillator = this.audioContext!.createOscillator()
        const gain = this.audioContext!.createGain()
        
        // Tipo de onda basado en la complejidad
        oscillator.type = density > 0.3 ? 'sawtooth' : 'sine'
        oscillator.frequency.setValueAtTime(freq, now)
        
        // Volumen individual basado en el índice y densidad
        const volume = (density * 0.2) / frequencies.length
        gain.gain.setValueAtTime(0, now)
        gain.gain.linearRampToValueAtTime(volume, now + 0.1)
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration)
        
        oscillator.connect(gain)
        gain.connect(this.masterGain)
        
        oscillator.start(now)
        oscillator.stop(now + duration)
        
        this.oscillators.set(`cellular_${index}_${generation}`, oscillator)
      }
    })
  }

  // Genera audio del atractor de Lorenz
  public generateChaosAudio(chaosPoints: any[], consciousnessLevel: number) {
    if (!this.isInitialized || !this.audioContext || !this.masterGain) return
    if (chaosPoints.length === 0) return

    const recentPoints = chaosPoints.slice(-20) // Últimos 20 puntos
    const now = this.audioContext.currentTime

    recentPoints.forEach((point, index) => {
      if (Math.random() < 0.1) { // Probabilidad de generar sonido
        const frequency = Math.abs(point.z) * 20 + 200 // Entre 200Hz y 800Hz aprox
        const duration = 0.2 + consciousnessLevel * 0.3
        
        const oscillator = this.audioContext!.createOscillator()
        const gain = this.audioContext!.createGain()
        const filter = this.audioContext!.createBiquadFilter()
        
        // Configurar oscilador
        oscillator.type = 'triangle'
        oscillator.frequency.setValueAtTime(frequency, now)
        
        // Filtro basado en la posición Y
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(Math.abs(point.y) * 100 + 400, now)
        filter.Q.setValueAtTime(5 + consciousnessLevel * 10, now)
        
        // Volumen basado en la energía del punto
        const volume = (point.energy || 0.1) * 0.05 * consciousnessLevel
        gain.gain.setValueAtTime(0, now)
        gain.gain.linearRampToValueAtTime(volume, now + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration)
        
        // Panneo basado en posición X
        const panner = this.audioContext!.createStereoPanner()
        panner.pan.setValueAtTime(Math.tanh(point.x * 0.1), now)
        
        oscillator.connect(filter)
        filter.connect(gain)
        gain.connect(panner)
        panner.connect(this.masterGain)
        
        oscillator.start(now + index * 0.01) // Pequeño delay entre puntos
        oscillator.stop(now + duration)
        
        this.oscillators.set(`chaos_${index}_${Date.now()}`, oscillator)
      }
    })
  }

  // Genera efectos de consciencia
  public generateConsciousnessAmbient(consciousnessLevel: number, evolutionStage: string) {
    if (!this.isInitialized || !this.audioContext || !this.masterGain) return
    if (consciousnessLevel < 0.1) return

    const now = this.audioContext.currentTime
    const duration = 2.0

    // Frecuencias de consciencia (basadas en ondas cerebrales)
    const consciousnessFreqs = {
      genesis: [8, 12], // Alpha waves
      expansion: [12, 30], // Beta waves  
      complexity: [30, 100], // Gamma waves
      consciousness: [4, 8], // Theta waves
      transcendence: [0.5, 4] // Delta waves
    }

    const freqRange = consciousnessFreqs[evolutionStage as keyof typeof consciousnessFreqs] || [8, 12]
    const baseFreq = freqRange[0] + (freqRange[1] - freqRange[0]) * consciousnessLevel

    // Crear drone de consciencia
    if (!this.oscillators.has('consciousness_drone')) {
      const oscillator = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      const filter = this.audioContext.createBiquadFilter()
      
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(baseFreq, now)
      
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(baseFreq * 4, now)
      filter.Q.setValueAtTime(10, now)
      
      const volume = consciousnessLevel * 0.03
      gain.gain.setValueAtTime(volume, now)
      
      oscillator.connect(filter)
      filter.connect(gain)
      gain.connect(this.masterGain)
      
      oscillator.start(now)
      
      this.oscillators.set('consciousness_drone', oscillator)
      
      // Parar después de un tiempo
      setTimeout(() => {
        oscillator.stop()
        this.oscillators.delete('consciousness_drone')
      }, duration * 1000)
    }
  }

  // Efectos de interacción del usuario
  public playInteractionSound(type: 'creation' | 'destruction' | 'consciousness', intensity: number) {
    if (!this.isInitialized || !this.audioContext || !this.masterGain) return

    const now = this.audioContext.currentTime
    const duration = 0.3

    const soundParams = {
      creation: { freq: 523.25, type: 'sine' as OscillatorType }, // C5
      destruction: { freq: 146.83, type: 'sawtooth' as OscillatorType }, // D3
      consciousness: { freq: 369.99, type: 'triangle' as OscillatorType } // F#4
    }

    const params = soundParams[type]
    
    const oscillator = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    
    oscillator.type = params.type
    oscillator.frequency.setValueAtTime(params.freq, now)
    
    const volume = intensity * 0.1
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(volume, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)
    
    oscillator.connect(gain)
    gain.connect(this.masterGain)
    
    oscillator.start(now)
    oscillator.stop(now + duration)
  }

  private cleanupOscillators() {
    // Limpiar osciladores que ya no están en uso
    for (const [key, oscillator] of this.oscillators.entries()) {
      try {
        oscillator.stop()
      } catch (e) {
        // El oscilador ya se detuvo
      }
    }
    this.oscillators.clear()
  }

  public setMasterVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        Math.max(0, Math.min(1, volume)), 
        this.audioContext?.currentTime || 0
      )
    }
  }

  public suspend() {
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend()
    }
  }

  public resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  public dispose() {
    this.cleanupOscillators()
    if (this.audioContext) {
      this.audioContext.close()
    }
  }
}

// Hook para usar el motor de audio
import { useEffect, useRef } from 'react'

export const useCosmicAudio = () => {
  const audioEngineRef = useRef<CosmicAudioEngine | null>(null)

  useEffect(() => {
    audioEngineRef.current = new CosmicAudioEngine()

    return () => {
      audioEngineRef.current?.dispose()
    }
  }, [])

  return audioEngineRef.current
}
