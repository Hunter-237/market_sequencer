/**
 * OrbitControls - Camera control system for 3D navigation
 * Simplified implementation for smooth camera movement and interaction
 */
class OrbitControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    
    // Control settings
    this.enabled = true;
    this.target = new THREE.Vector3();
    this.enableZoom = true;
    this.zoomSpeed = 1.0;
    this.enableRotate = true;
    this.rotateSpeed = 1.0;
    this.enablePan = true;
    this.panSpeed = 1.0;
    this.autoRotate = false;
    this.autoRotateSpeed = 2.0;
    
    // Internal state
    this._state = 'none';
    this._spherical = new THREE.Spherical();
    this._sphericalDelta = new THREE.Spherical();
    this._scale = 1;
    this._panOffset = new THREE.Vector3();
    this._zoomChanged = false;
    
    // Mouse tracking
    this._rotateStart = new THREE.Vector2();
    this._rotateEnd = new THREE.Vector2();
    this._rotateDelta = new THREE.Vector2();
    this._panStart = new THREE.Vector2();
    this._panEnd = new THREE.Vector2();
    this._panDelta = new THREE.Vector2();
    
    // Bind event handlers
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onMouseWheel = this._onMouseWheel.bind(this);
    this._onContextMenu = this._onContextMenu.bind(this);
    
    // Add event listeners
    this._addEventListeners();
    
    // Initial update
    this.update();
  }
  
  /**
   * Add all necessary event listeners
   */
  _addEventListeners() {
    this.domElement.addEventListener('mousedown', this._onMouseDown);
    this.domElement.addEventListener('wheel', this._onMouseWheel);
    this.domElement.addEventListener('contextmenu', this._onContextMenu);
  }
  
  /**
   * Remove all event listeners
   */
  dispose() {
    this.domElement.removeEventListener('mousedown', this._onMouseDown);
    this.domElement.removeEventListener('wheel', this._onMouseWheel);
    this.domElement.removeEventListener('contextmenu', this._onContextMenu);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup', this._onMouseUp);
  }
  
  /**
   * Main update method - called in animation loop
   */
  update() {
    const position = this.camera.position;
    
    // Apply auto rotation
    if (this.autoRotate && this._state === 'none') {
      const rotAngle = 2 * Math.PI / 60 / 60 * this.autoRotateSpeed;
      this._sphericalDelta.theta -= rotAngle;
    }
    
    // Get current camera direction vector
    const offset = new THREE.Vector3();
    offset.copy(position).sub(this.target);
    
    // Convert to spherical coordinates
    this._spherical.setFromVector3(offset);
    
    // Apply deltas
    this._spherical.theta += this._sphericalDelta.theta;
    this._spherical.phi += this._sphericalDelta.phi;
    
    // Restrict phi to avoid flipping
    this._spherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, this._spherical.phi));
    
    // Ensure spherical coordinates are safe
    this._spherical.makeSafe();
    
    // Apply scale
    this._spherical.radius *= this._scale;
    
    // Apply pan offset
    this.target.add(this._panOffset);
    
    // Convert back to cartesian
    offset.setFromSpherical(this._spherical);
    
    // Update position
    position.copy(this.target).add(offset);
    
    // Make camera look at target
    this.camera.lookAt(this.target);
    
    // Reset values
    this._sphericalDelta.set(0, 0, 0);
    this._panOffset.set(0, 0, 0);
    this._scale = 1;
    
    return true;
  }
  
  /**
   * Handle mouse down events
   */
  _onMouseDown(event) {
    if (!this.enabled) return;
    
    event.preventDefault();
    
    switch (event.button) {
      case 0: // Left button - rotate
        if (this.enableRotate) {
          this._state = 'rotate';
          this._rotateStart.set(event.clientX, event.clientY);
        }
        break;
        
      case 1: // Middle button - pan
        if (this.enablePan) {
          this._state = 'pan';
          this._panStart.set(event.clientX, event.clientY);
        }
        break;
        
      case 2: // Right button - pan
        if (this.enablePan) {
          this._state = 'pan';
          this._panStart.set(event.clientX, event.clientY);
        }
        break;
    }
    
    if (this._state !== 'none') {
      document.addEventListener('mousemove', this._onMouseMove, false);
      document.addEventListener('mouseup', this._onMouseUp, false);
    }
  }
  
  /**
   * Handle mouse move events
   */
  _onMouseMove(event) {
    if (!this.enabled) return;
    
    event.preventDefault();
    
    switch (this._state) {
      case 'rotate':
        this._rotateEnd.set(event.clientX, event.clientY);
        this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart);
        
        // Calculate rotation deltas
        this._sphericalDelta.theta -= 2 * Math.PI * this._rotateDelta.x / this.domElement.clientHeight * this.rotateSpeed;
        this._sphericalDelta.phi -= 2 * Math.PI * this._rotateDelta.y / this.domElement.clientHeight * this.rotateSpeed;
        
        this._rotateStart.copy(this._rotateEnd);
        break;
        
      case 'pan':
        this._panEnd.set(event.clientX, event.clientY);
        this._panDelta.subVectors(this._panEnd, this._panStart);
        
        // Calculate pan offset
        const panFactor = 0.002 * this.camera.position.distanceTo(this.target);
        this._panOffset.x -= this._panDelta.x * panFactor;
        this._panOffset.y += this._panDelta.y * panFactor;
        
        this._panStart.copy(this._panEnd);
        break;
    }
  }
  
  /**
   * Handle mouse up events
   */
  _onMouseUp() {
    document.removeEventListener('mousemove', this._onMouseMove, false);
    document.removeEventListener('mouseup', this._onMouseUp, false);
    this._state = 'none';
  }
  
  /**
   * Handle mouse wheel events for zooming
   */
  _onMouseWheel(event) {
    if (!this.enabled || !this.enableZoom) return;
    
    event.preventDefault();
    
    const delta = event.deltaY;
    
    if (delta > 0) {
      this._scale /= Math.pow(0.95, this.zoomSpeed);
    } else if (delta < 0) {
      this._scale *= Math.pow(0.95, this.zoomSpeed);
    }
  }
  
  /**
   * Prevent context menu on right click
   */
  _onContextMenu(event) {
    if (!this.enabled) return;
    event.preventDefault();
  }
  
  /**
   * Reset the controls to default state
   */
  reset() {
    this.target.set(0, 0, 0);
    this._state = 'none';
    this._sphericalDelta.set(0, 0, 0);
    this._panOffset.set(0, 0, 0);
    this._scale = 1;
  }
  
  /**
   * Set the auto rotate speed
   */
  setAutoRotateSpeed(speed) {
    this.autoRotateSpeed = speed;
  }
  
  /**
   * Toggle auto rotation
   */
  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    return this.autoRotate;
  }
}

// Add to THREE namespace for compatibility
if (typeof THREE !== 'undefined') {
  THREE.OrbitControls = OrbitControls;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OrbitControls;
}