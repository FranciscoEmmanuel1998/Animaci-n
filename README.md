# 🌌 Animación Cósmica - Portfolio Interactivo

**Un viaje visual por el universo de la programación y la animación digital**

[![GitHub](https://img.shields.io/badge/GitHub-franciscoemmanuel1998-blue?style=for-the-badge&logo=github)](https://github.com/FranciscoEmmanuel1998/Animaci-n)

---

## 👨‍🎓 Autor

**Francisco Emmanuel Arias López**  
🎓 Licenciado en Multimedia y Animación Digital  
🏫 Facultad de Ciencias Físico Matemáticas  

---

## 🎯 Descripción del Proyecto

Este proyecto es una experiencia visual inmersiva que combina múltiples simulaciones matemáticas y físicas en tiempo real, creando un universo digital interactivo. Representa la convergencia entre arte, ciencia y tecnología, mostrando la belleza inherente en los sistemas complejos.

### ✨ Características Principales

- **🎨 Simulaciones Visuales Complejas**
  - Autómata Celular de Conway (Game of Life)
  - Atractor de Lorenz con proyección 3D
  - Sistema de partículas estelares
  - Campo de energía cósmica dinámico

- **🎵 Audio Interactivo**
  - Explosión Big Bang sintetizada proceduralmente
  - Música de fondo reactiva al audio
  - Análisis FFT en tiempo real
  - Visualización audio-reactiva

- **🎮 Cámara 3D Inmersiva**
  - Movimiento orbital automático
  - Perspectiva espacial realista
  - Efectos de profundidad y parallax
  - Rotación completa (Pitch, Yaw, Roll)

- **🌟 Efectos Visuales Avanzados**
  - Resplandores dinámicos
  - Gradientes adaptativos
  - Partículas con física realista
  - Transformaciones 3D en tiempo real

---

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18** - Framework principal
- **TypeScript** - Tipado estático
- **Vite** - Build tool moderno
- **Tailwind CSS** - Estilos utilitarios

### Renderizado & Animación
- **HTML5 Canvas** - Renderizado 2D/3D
- **Web Audio API** - Síntesis y análisis de audio
- **RequestAnimationFrame** - Loop de animación optimizado

### Algoritmos & Matemáticas
- **Conway's Game of Life** - Autómata celular
- **Sistema de Lorenz** - Atractor caótico
- **Transformaciones 3D** - Matrices de rotación
- **FFT Analysis** - Análisis frecuencial

---

## 🚀 Instalación y Uso

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Navegador moderno con soporte para Web Audio API

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/FranciscoEmmanuel1998/Animaci-n.git

# Navegar al directorio
cd Animaci-n

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build
```

### Comandos Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Construir para producción
npm run preview      # Previsualizar build
npm run lint         # Linter de código
```

---

## 🎮 Controles e Interacciones

- **🔊/🔇** - Control de audio
- **ⓘ INFO** - Información del autor
- **❓ ¿QUÉ VES?** - Explicación técnica
- **⟲** - Reiniciar simulación
- **🖱️ Click** - Activar audio (requerido por navegadores)

---

## 🧬 Componentes Técnicos

### Sistema de Simulación Principal
```
EnhancedCombinedSimulation.tsx
├── 🌌 Fondo Cósmico Dinámico
├── 🎯 Autómata Celular de Conway
├── 🌀 Atractor de Lorenz 3D
├── ⚡ Sistema de Partículas
├── 🎵 Motor de Audio Procedural
└── 📹 Cámara 3D Orbital
```

### Arquitectura de Audio
```
CosmicAudioEngine.ts
├── 💥 Síntesis de Explosión Nuclear
├── 🎼 Análisis FFT en Tiempo Real
├── 🔊 Gestión de Contexto de Audio
└── 🎨 Mapeo Audio-Visual
```

---

## 🔬 Algoritmos Implementados

### 1. **Conway's Game of Life**
- Implementación optimizada del autómata celular
- Mutaciones cósmicas aleatorias
- Integración con sistema de partículas

### 2. **Atractor de Lorenz**
```javascript
// Ecuaciones diferenciales
dx/dt = σ(y - x)
dy/dt = x(ρ - z) - y
dz/dt = xy - βz
```

### 3. **Transformaciones 3D**
- Rotación Yaw, Pitch, Roll
- Proyección perspectiva
- Sistema de coordenadas cósmico

### 4. **Síntesis de Audio Procedural**
- Osciladores múltiples
- Filtros dinámicos
- Reverb de convolución
- Compresión dinámica

---

## 🎨 Características Visuales

### Paleta de Colores Cósmica
- **Dorado Estelar** (`#FFD700`) - Elementos principales
- **Ámbar Cósmico** (`#FFA500`) - Acentos dinámicos
- **Azul Profundo** (`#000080`) - Espacio profundo
- **Blanco Estelar** (`#FFFFFF`) - Highlights

### Efectos de Renderizado
- **Composición Aditiva** - Efectos de luz realistas
- **Desvanecimiento Gradual** - Estelas de movimiento
- **Resplandores Dinámicos** - Intensidad variable
- **Transparencias Complejas** - Capas visuales

---

## 📱 Responsividad

El proyecto está optimizado para múltiples dispositivos:

- **🖥️ Desktop** - Experiencia completa
- **📱 Mobile** - Adaptación táctil
- **📊 Tablet** - Interfaz intermedia
- **⌚ Smartwatch** - Vista minimalista

---

## 🌐 Compatibilidad de Navegadores

| Navegador | Versión Mínima | Estado |
|-----------|----------------|--------|
| Chrome    | 88+            | ✅ Completo |
| Firefox   | 85+            | ✅ Completo |
| Safari    | 14+            | ⚠️ Limitado* |
| Edge      | 88+            | ✅ Completo |

*Algunas características de Web Audio API pueden estar limitadas

---

## 🚀 Roadmap Futuro

### v2.0 - Expansión Dimensional
- [ ] Renderizado WebGL/Three.js
- [ ] Realidad Virtual (WebXR)
- [ ] Física cuántica simulada
- [ ] IA generativa integrada

### v2.1 - Interactividad Avanzada
- [ ] Control manual de cámara
- [ ] Parámetros ajustables en vivo
- [ ] Grabación de sesiones
- [ ] Modo colaborativo

### v2.2 - Optimización
- [ ] Web Workers para cálculos
- [ ] Service Workers (PWA)
- [ ] Lazy loading inteligente
- [ ] Compresión de assets

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas.
---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

---

## 🙏 Agradecimientos

- **Conway, John Horton** - Por el Game of Life
- **Lorenz, Edward** - Por el sistema de ecuaciones caóticas
- **Community React** - Por el ecosistema increíble
- **Web Audio API** - Por hacer posible el audio procedural

---

## 📬 Contacto

**Francisco Emmanuel Arias López**

-  GitHub: [@FranciscoEmmanuel1998](https://github.com/FranciscoEmmanuel1998)

---

<div align="center">

**⭐ Si te gusta este proyecto, dale una estrella en GitHub ⭐**

**Hecho con ❤️ y mucho ☕ en México 🇲🇽**

---

*"En el caos de los números, encuentra la belleza del universo"* 🌌

</div>
