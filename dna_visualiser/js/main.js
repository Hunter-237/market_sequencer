/**
 * Market DNA Spiral - Main Application
 * Orchestrates the 3D visualization and user interactions
 */
class MarketDNAApp {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.dnaVisualizer = null;
    this.clock = new THREE.Clock();
    
    // Animation and interaction state
    this.dnaSelfRotate = true;
    this.dnaSelfRotateSpeed = 1.0;
    this.stars = null;
    this.nebulas = [];
    this.accentLights = [];
    
    // UI elements
    this.debugBox = null;
    this.infoBox = null;
    this.sequenceStats = null;
    
    // Raycaster for mouse interactions
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Bind methods
    this.animate = this.animate.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onFileLoad = this.onFileLoad.bind(this);
    this.debugLog = this.debugLog.bind(this);
  }
  
  /**
   * Initialize the application
   */
  async init() {
    this.debugLog("System initialization...");
    
    // Get UI elements
    this.debugBox = document.getElementById('debugBox');
    this.infoBox = document.getElementById('infoBox');
    this.sequenceStats = document.getElementById('sequenceStats');
    
    // Initialize Three.js scene
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initControls();
    this.initLighting();
    this.initBackground();
    
    // Initialize DNA visualizer
    this.dnaVisualizer = new DNAVisualizer(this.scene);
    
    // Setup UI event listeners
    this.setupEventListeners();
    this.setupControlPanelEventListeners();
    
    // Start animation loop
    this.animate();
    
    this.debugLog("Market Genome Analysis system online. Ready for sequence data input.");
    this.debugLog("Press 'V' to toggle DNA visibility, 'R' to reset camera, 'D' to debug DNA position");
  }
  
  /**
   * Initialize the Three.js scene
   */
  initScene() {
    this.scene = new THREE.Scene();
  }
  
  /**
   * Initialize the camera
   */
  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      2000
    );
    this.camera.position.set(0, 10, 100);
  }
  
  /**
   * Initialize the WebGL renderer
   */
  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
  }
  
  /**
   * Initialize camera controls
   */
  initControls() {
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.7;
    this.controls.enablePan = true;
    this.controls.enableZoom = true;
    this.controls.minDistance = 40;
    this.controls.maxDistance = 300;
  }
  
  /**
   * Initialize scene lighting
   */
  initLighting() {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x2a3a5a, 0.8);
    this.scene.add(ambientLight);
    
    // Main directional light
    const mainLight = new THREE.DirectionalLight(0xddddff, 0.8);
    mainLight.position.set(20, 40, 50);
    mainLight.castShadow = false;
    this.scene.add(mainLight);
    
    // Back light for balanced illumination
    const backLight = new THREE.DirectionalLight(0xc4d7ff, 0.6);
    backLight.position.set(-30, -10, -50);
    backLight.castShadow = false;
    this.scene.add(backLight);
    
    // Hemisphere light for even illumination
    const hemiLight = new THREE.HemisphereLight(0x4286f4, 0x2a3a5a, 0.8);
    this.scene.add(hemiLight);
    
    // Accent lights for atmosphere
    const accentLight1 = new THREE.PointLight(0x00E2C5, 0.6, 300);
    accentLight1.position.set(-50, -30, 20);
    this.scene.add(accentLight1);
    this.accentLights.push(accentLight1);
    
    const accentLight2 = new THREE.PointLight(0xE55C7A, 0.4, 250);
    accentLight2.position.set(30, -20, -40);
    this.scene.add(accentLight2);
    this.accentLights.push(accentLight2);
  }
  
  /**
   * Initialize starfield and nebula background
   */
  initBackground() {
    this.createStarField();
    this.createNebulas();
  }
  
  /**
   * Create starfield background
   */
  createStarField() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xd7e5ff,
      size: 0.6,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });
    
    const starsVertices = [];
    
    // Create star clusters
    for (let c = 0; c < 10; c++) {
      const phi = Math.random() * Math.PI * 2;
      const costheta = Math.random() * 2 - 1;
      const theta = Math.acos(costheta);
      const radius = 500 + Math.random() * 1000;
      
      const cx = radius * Math.sin(theta) * Math.cos(phi);
      const cy = radius * Math.sin(theta) * Math.sin(phi);
      const cz = radius * Math.cos(theta);
      
      const clusterSize = 50 + Math.random() * 100;
      for (let i = 0; i < clusterSize; i++) {
        const spreadPhi = Math.random() * Math.PI * 2;
        const spreadCosTheta = Math.random() * 2 - 1;
        const spreadTheta = Math.acos(spreadCosTheta);
        const spreadRadius = (100 + Math.random() * 150) * Math.pow(Math.random(), 1/3);
        
        const x = cx + spreadRadius * Math.sin(spreadTheta) * Math.cos(spreadPhi);
        const y = cy + spreadRadius * Math.sin(spreadTheta) * Math.sin(spreadPhi);
        const z = cz + spreadRadius * Math.cos(spreadTheta);
        starsVertices.push(x, y, z);
      }
    }
    
    // Add scattered stars
    for (let i = 0; i < 1000; i++) {
      const phi = Math.random() * Math.PI * 2;
      const costheta = Math.random() * 2 - 1;
      const theta = Math.acos(costheta);
      const radius = 300 + Math.random() * 1700;
      
      const x = radius * Math.sin(theta) * Math.cos(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(theta);
      starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    this.stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(this.stars);
  }
  
  /**
   * Create nebula effects
   */
  createNebulas() {
    const nebulaColors = [0x1A2758, 0x273266, 0x3A284A];
    
    for (let c = 0; c < 2; c++) {
      const nebulaGeometry = new THREE.BufferGeometry();
      const nebulaVertices = [];
      
      const phi = Math.random() * Math.PI * 2;
      const costheta = Math.random() * 2 - 1;
      const theta = Math.acos(costheta);
      const radius = 600 + Math.random() * 800;
      
      const cx = radius * Math.sin(theta) * Math.cos(phi);
      const cy = radius * Math.sin(theta) * Math.sin(phi);
      const cz = radius * Math.cos(theta);
      
      const nebulaColor = nebulaColors[c % nebulaColors.length];
      const nebulaSize = 800 + Math.random() * 400;
      
      for (let i = 0; i < nebulaSize; i++) {
        const spreadPhi = Math.random() * Math.PI * 2;
        const spreadCosTheta = Math.random() * 2 - 1;
        const spreadTheta = Math.acos(spreadCosTheta);
        const spreadRadius = (150 + Math.random() * 250) * Math.pow(Math.random(), 1/3);
        
        const x = cx + spreadRadius * Math.sin(spreadTheta) * Math.cos(spreadPhi);
        const y = cy + spreadRadius * Math.sin(spreadTheta) * Math.sin(spreadPhi);
        const z = cz + spreadRadius * Math.cos(spreadTheta);
        nebulaVertices.push(x, y, z);
      }
      
      nebulaGeometry.setAttribute('position', new THREE.Float32BufferAttribute(nebulaVertices, 3));
      const nebulaMaterial = new THREE.PointsMaterial({
        color: nebulaColor,
        size: 1.2 + Math.random() * 1.2,
        transparent: true,
        opacity: 0.15 + Math.random() * 0.08,
        blending: THREE.AdditiveBlending
      });
      
      const nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
      nebula.userData.animationParams = {
        rotationSpeed: (Math.random() * 0.005) * (Math.random() > 0.5 ? 1 : -1),
        center: new THREE.Vector3(cx, cy, cz)
      };
      
      this.scene.add(nebula);
      this.nebulas.push(nebula);
    }
  }
  
  /**
   * Setup main event listeners
   */
  setupEventListeners() {
    // Window resize
    window.addEventListener('resize', this.onWindowResize);
    
    // Mouse movement for raycasting
    window.addEventListener('mousemove', this.onMouseMove);
    
    // File input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
      fileInput.addEventListener('change', this.onFileLoad);
    }
    
    // Keyboard shortcuts
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    
    // Type selector buttons
    document.querySelectorAll('.type-btn').forEach(btn => {
      btn.addEventListener('click', this.onTypeButtonClick.bind(this));
    });
  }
  
  /**
   * Setup control panel event listeners
   */
  setupControlPanelEventListeners() {
    // Main control buttons
    const rotateBtn = document.getElementById('rotateBtn');
    const selfRotateBtn = document.getElementById('selfRotateBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    if (rotateBtn) {
      rotateBtn.addEventListener('click', () => {
        this.controls.autoRotate = !this.controls.autoRotate;
        rotateBtn.classList.toggle('active');
      });
    }
    
    if (selfRotateBtn) {
      selfRotateBtn.addEventListener('click', () => {
        this.dnaSelfRotate = !this.dnaSelfRotate;
        selfRotateBtn.classList.toggle('active');
      });
    }
    
    if (resetBtn) {
      resetBtn.addEventListener('click', this.resetCamera.bind(this));
    }
    
    // Sliders
    this.setupSliderEventListeners();
  }
  
  /**
   * Setup slider event listeners
   */
  setupSliderEventListeners() {
    const sliders = {
      rotationSpeed: (value) => { this.controls.autoRotateSpeed = parseFloat(value); },
      dnaRotationSpeed: (value) => { this.dnaSelfRotateSpeed = parseFloat(value); },
      dnaScale: (value) => { this.updateDNAScale(parseFloat(value)); },
      helixTurns: (value) => { this.updateHelixTurns(parseInt(value)); },
      helixRadius: (value) => { this.updateHelixRadius(parseInt(value)); },
      backboneThickness: (value) => { this.updateBackboneThickness(parseFloat(value)); }
    };
    
    Object.entries(sliders).forEach(([id, handler]) => {
      const slider = document.getElementById(id);
      if (slider) {
        slider.addEventListener('input', (e) => handler(e.target.value));
      }
    });
  }
  
  /**
   * Handle file loading
   */
  onFileLoad(event) {
    const file = event.target.files[0];
    if (!file) {
      this.debugLog("No file selected.");
      return;
    }
    
    this.debugLog(`Selected file: ${file.name} (${Math.round(file.size / 1024)} KB)`);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      this.debugLog("File loaded successfully!");
      const result = this.dnaVisualizer.loadFromText(e.target.result);
      if (result) {
        this.updateSequenceStats();
        setTimeout(() => this.checkDNAVisibility(), 100);
      }
    };
    reader.onerror = (e) => {
      this.debugLog(`ERROR: Failed to read file: ${e.target.error}`);
    };
    
    try {
      reader.readAsText(file);
    } catch (error) {
      this.debugLog(`ERROR: ${error.message}`);
    }
  }
  
  /**
   * Handle type button clicks
   */
  onTypeButtonClick(event) {
    const btn = event.target;
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const selectedType = btn.dataset.type;
    this.dnaVisualizer.setSelectedType(selectedType);
    this.dnaVisualizer.updateVisualization();
    this.updateSequenceStats();
  }
  
  /**
   * Handle keyboard shortcuts
   */
  onKeyDown(event) {
    switch (event.key.toLowerCase()) {
      case 'v':
        this.toggleDNAVisibility();
        break;
      case 'r':
        this.resetCamera();
        break;
      case 'd':
        this.checkDNAVisibility();
        break;
    }
  }
  
  /**
   * Handle window resize
   */
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  /**
   * Handle mouse movement for raycasting
   */
  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }
  
  /**
   * Update DNA scale
   */
  updateDNAScale(scale) {
    const dnaGroup = this.dnaVisualizer.getDNAGroup();
    if (dnaGroup) {
      dnaGroup.scale.set(scale, scale, scale);
    }
  }
  
  /**
   * Update helix turns and rebuild
   */
  updateHelixTurns(turns) {
    this.dnaVisualizer.setConfig('helixTurns', turns);
    this.dnaVisualizer.updateVisualization();
  }
  
  /**
   * Update helix radius and rebuild
   */
  updateHelixRadius(radius) {
    this.dnaVisualizer.setConfig('helixRadius', radius);
    this.dnaVisualizer.updateVisualization();
  }
  
  /**
   * Update backbone thickness and rebuild
   */
  updateBackboneThickness(thickness) {
    this.dnaVisualizer.setConfig('backboneThickness', thickness);
    this.dnaVisualizer.updateVisualization();
  }
  
  /**
   * Update sequence statistics display
   */
  updateSequenceStats() {
    const lastLoadedData = this.dnaVisualizer.getLastLoadedData();
    if (!lastLoadedData || lastLoadedData.length === 0) return;
    
    const stats = this.dnaVisualizer.calculateStats();
    if (!stats) return;
    
    // Show the stats panel
    if (this.sequenceStats) {
      this.sequenceStats.style.display = 'block';
    }
    
    // Update UI elements
    const elements = {
      totalSegments: stats.totalSegments,
      optimalCount: stats.typeCounts.optimal || 0,
      negativeCount: stats.typeCounts.negative || 0,
      volatility: stats.volatility
    };
    
    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    });
    
    // Update data indicator
    const dataIndicator = document.querySelector('.data-indicator');
    if (dataIndicator) {
      const selectedType = this.dnaVisualizer.getSelectedType();
      dataIndicator.textContent = `  ANALYZING ${selectedType.toUpperCase()} GENOME SEQUENCE...`;
    }
  }
  
  /**
   * Update info box with hover information
   */
  updateInfoBox() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    const target = intersects.find(obj => obj.object.userData?.info);
    
    if (target && this.infoBox) {
      const panelContent = this.infoBox.querySelector('.panel-content');
      if (panelContent) {
        panelContent.innerHTML = target.object.userData.info;
      } else {
        this.infoBox.innerHTML = target.object.userData.info;
      }
      this.infoBox.style.boxShadow = "0 0 25px rgba(66, 134, 244, 0.3)";
    } else if (this.infoBox) {
      const panelContent = this.infoBox.querySelector('.panel-content');
      if (panelContent) {
        panelContent.innerHTML = "Hover over genomic segments to view detailed analysis.";
      } else {
        // If no panel-content div exists, create the proper structure
        this.infoBox.innerHTML = `
          <div class="panel-header">
            <div class="panel-title">SEQUENCE INFO</div>
            <div class="panel-controls">
              <button class="panel-btn" title="Refresh">⟳</button>
              <button class="panel-btn" title="Close">⨯</button>
            </div>
          </div>
          <div class="panel-content">
            Hover over genomic segments to view detailed analysis.
          </div>
        `;
      }
      this.infoBox.style.boxShadow = "0 0 25px rgba(66, 134, 244, 0.15)";
    }
  }
  
  /**
   * Toggle DNA visibility
   */
  toggleDNAVisibility() {
    const dnaGroup = this.dnaVisualizer.getDNAGroup();
    if (dnaGroup) {
      dnaGroup.visible = !dnaGroup.visible;
      this.debugLog(`DNA visibility set to: ${dnaGroup.visible}`);
    } else {
      this.debugLog("No DNA group exists yet");
    }
  }
  
  /**
   * Reset camera position and controls
   */
  resetCamera() {
    this.camera.position.set(0, 10, 100);
    this.camera.lookAt(0, 0, 0);
    this.controls.target.set(0, 0, 0);
    
    const dnaGroup = this.dnaVisualizer.getDNAGroup();
    if (dnaGroup) {
      dnaGroup.rotation.set(0, Math.PI/6, 0);
      dnaGroup.scale.set(1, 1, 1);
    }
    
    // Reset scale slider
    const scaleSlider = document.getElementById('dnaScale');
    if (scaleSlider) {
      scaleSlider.value = 1;
    }
    
    this.debugLog("Camera and view reset");
  }
  
  /**
   * Check DNA visibility and position
   */
  checkDNAVisibility() {
    const dnaGroup = this.dnaVisualizer.getDNAGroup();
    if (dnaGroup) {
      const boundingBox = new THREE.Box3().setFromObject(dnaGroup);
      const size = new THREE.Vector3();
      boundingBox.getSize(size);
      
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);
      
      this.debugLog(`DNA Bounds: Size ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}, Center at ${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)}`);
      this.debugLog(`Camera position: ${this.camera.position.x.toFixed(2)}, ${this.camera.position.y.toFixed(2)}, ${this.camera.position.z.toFixed(2)}`);
      
      if (Math.abs(this.camera.position.z) < 40) {
        this.camera.position.set(0, 10, 100);
        this.camera.lookAt(0, 0, 0);
        this.debugLog("Camera position reset for better view");
      }
    }
  }
  
  /**
   * Main animation loop
   */
  animate() {
    requestAnimationFrame(this.animate);
    
    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.elapsedTime;
    
    // Update controls
    this.controls.update();
    
    // Self-rotation of DNA helix
    const dnaGroup = this.dnaVisualizer.getDNAGroup();
    if (dnaGroup && this.dnaSelfRotate) {
      dnaGroup.rotation.y += delta * this.dnaSelfRotateSpeed;
    }
    
    // Animate scene elements
    this.animateSceneElements(elapsedTime, delta);
    
    // Update info box
    this.updateInfoBox();
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * Animate various scene elements
   */
  animateSceneElements(elapsedTime, delta) {
    // Animate pulse effects and nebulas
    this.scene.traverse(object => {
      if (object.userData.animationParams) {
        if (object.userData.animationParams.initialScale) {
          // Pulse animation
          const params = object.userData.animationParams;
          const scale = params.initialScale + 
            (params.maxScale - params.initialScale) * 
            (0.5 + 0.5 * Math.sin(elapsedTime * params.pulseSpeed + params.phase));
          
          object.scale.set(scale, scale, scale);
          object.material.opacity = 0.3 * (1 - (scale - params.initialScale) / (params.maxScale - params.initialScale));
        } else if (object.userData.animationParams.rotationSpeed) {
          // Nebula rotation
          object.rotation.y += object.userData.animationParams.rotationSpeed * delta;
        }
      }
    });
    
    // Animate accent lights
    if (this.accentLights.length >= 2) {
      const time = elapsedTime;
      
      this.accentLights[0].position.x = Math.sin(time * 0.1) * 60;
      this.accentLights[0].position.z = Math.cos(time * 0.15) * 40;
      this.accentLights[0].intensity = 0.5 + 0.2 * Math.sin(time * 0.3);
      
      this.accentLights[1].position.x = Math.sin(time * 0.08 + 2) * 50;
      this.accentLights[1].position.z = Math.cos(time * 0.1 + 1) * 50;
      this.accentLights[1].intensity = 0.3 + 0.15 * Math.sin(time * 0.2 + 2);
    }
  }
  
  /**
   * Debug logging function
   */
  debugLog(message) {
    if (this.debugBox) {
      const timestamp = new Date().toLocaleTimeString();
      this.debugBox.innerHTML += `<span style="opacity:0.7;">[${timestamp}]</span> ${message}<br>`;
      this.debugBox.scrollTop = this.debugBox.scrollHeight;
    } else {
      console.log(`[MarketDNA] ${message}`);
    }
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new MarketDNAApp();
  app.init().catch(error => {
    console.error('Failed to initialize Market DNA App:', error);
  });
  
  // Make app globally available for debugging
  window.marketDNAApp = app;
});