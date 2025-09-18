/**
 * DNA Visualizer - Market DNA Helix Visualization
 * Handles creation and manipulation of the 3D DNA structure
 */
class DNAVisualizer {
  constructor(scene) {
    this.scene = scene;
    this.dnaGroup = null;
    this.lastLoadedData = null;
    this.selectedType = "optimal";
    
    // Configuration
    this.config = {
      helixTurns: 15,
      helixRadius: 10,
      backboneThickness: 1.2,
      height: 200,
      pointsPerTurn: 32
    };
    
    // Color mapping for different segment types
    this.colorMap = {
      'negative': 0xE55C7A, // dusty rose/berry
      'optimal': 0x00E2C5   // cyan with hint of green
    };
    
    this.debugLog = this.debugLog.bind(this);
  }
  
  /**
   * Set configuration values
   */
  setConfig(key, value) {
    if (this.config.hasOwnProperty(key)) {
      this.config[key] = value;
    }
  }
  
  /**
   * Get configuration value
   */
  getConfig(key) {
    return this.config[key];
  }
  
  /**
   * Set the selected segment type for filtering
   */
  setSelectedType(type) {
    this.selectedType = type;
  }
  
  /**
   * Get the selected segment type
   */
  getSelectedType() {
    return this.selectedType;
  }
  
  /**
   * Filter segments based on selected type
   */
  filterSegmentsByType(data, type) {
    if (type === 'all') {
      return data;
    }
    return data.filter(segment => segment.segment_type === type);
  }
  
  /**
   * Validate segment data structure
   */
  validateData(data) {
    this.debugLog("Validating segments data...");
    
    if (!Array.isArray(data)) {
      this.debugLog("⚠️ JSON data is not an array");
      return [];
    }
    
    if (data.length > 0) {
      this.debugLog(`Sample segment: ${JSON.stringify(data[0])}`);
    }
    
    const validData = data.filter(segment => 
      segment.segment_type && 
      segment.start_index !== undefined && 
      segment.end_index !== undefined && 
      segment.start_price !== undefined && 
      segment.end_price !== undefined && 
      segment.pct_change !== undefined
    );
    
    if (validData.length === 0) {
      this.debugLog("⚠️ No valid segments found in the JSON. Please check the file format.");
    } else {
      this.debugLog(`✓ Found ${validData.length} valid segments out of ${data.length}`);
    }
    
    return validData;
  }
  
  /**
   * Create the DNA helix structure
   */
  createDNAHelix(data) {
    this.debugLog("Generating market genome structure...");
    const group = new THREE.Group();
    const numSegments = data.length;
    
    // Handle empty data case
    if (numSegments === 0) {
      this.debugLog("No genomic segments to visualize");
      return group;
    }
    
    const radius = this.config.helixRadius; // Use the adjustable radius instead of fixed value
    const turns = this.config.helixTurns; // Number of complete turns in the helix
    const height = 200; // Total height of the helix
    const segmentSpacing = height / numSegments; // Vertical spacing between segments
    const backboneThickness = this.config.backboneThickness; // Use adjustable backbone thickness
    
    this.debugLog(`Building helix with ${numSegments} segments, ${turns} turns, radius ${radius}, and backbone thickness ${backboneThickness}`);
    
    // Create the two backbone strands of the DNA helix
    const backbone1Points = [];
    const backbone2Points = [];
    
    // Generate points for the two spiral backbones with higher resolution
    const pointsPerTurn = 32; // Higher resolution for smoother curve
    const totalPoints = turns * pointsPerTurn;
    
    for (let i = 0; i <= totalPoints; i++) {
      const t = i / totalPoints;
      const y = height * (0.5 - t); // Start from top, go down
      const angle = 2 * Math.PI * turns * t;
      
      // First backbone
      backbone1Points.push(
        new THREE.Vector3(
          radius * Math.cos(angle),
          y,
          radius * Math.sin(angle)
        )
      );
      
      // Second backbone (opposite side of helix)
      backbone2Points.push(
        new THREE.Vector3(
          radius * Math.cos(angle + Math.PI),
          y,
          radius * Math.sin(angle + Math.PI)
        )
      );
    }
    
    // Create visible backbones with tubes - enhanced with metallic effect
    // Using the variable backboneThickness instead of hardcoded value
    
    // Create smooth curve for backbone 1
    const backboneCurve1 = new THREE.CatmullRomCurve3(backbone1Points);
    const backboneGeometry1 = new THREE.TubeGeometry(backboneCurve1, totalPoints, backboneThickness, 8, false);
    
    // Create metallic backbone material with environment mapping
    const backboneMaterial1 = new THREE.MeshStandardMaterial({
      color: 0x4286f4,
      metalness: 0.7,
      roughness: 0.3,
      transparent: true,
      opacity: 0.9, // Increased opacity for better visibility
      emissive: 0x1a3a7a,
      emissiveIntensity: 0.3 // Increased intensity
    });
    
    const backbone1 = new THREE.Mesh(backboneGeometry1, backboneMaterial1);
    group.add(backbone1);
    
    // Create smooth curve for backbone 2
    const backboneCurve2 = new THREE.CatmullRomCurve3(backbone2Points);
    const backboneGeometry2 = new THREE.TubeGeometry(backboneCurve2, totalPoints, backboneThickness, 8, false);
    
    const backboneMaterial2 = new THREE.MeshStandardMaterial({
      color: 0x4286f4,
      metalness: 0.7,
      roughness: 0.3,
      transparent: true,
      opacity: 0.8,
      emissive: 0x1a3a7a,
      emissiveIntensity: 0.2
    });
    
    const backbone2 = new THREE.Mesh(backboneGeometry2, backboneMaterial2);
    group.add(backbone2);
    
    // Add the horizontal "rungs" (base pairs) between the backbones
    for (let i = 0; i < numSegments; i++) {
      const segment = data[i];
      const startIdx = parseInt(segment.start_index);
      const endIdx = parseInt(segment.end_index);
      const startPrice = parseFloat(segment.start_price);
      const endPrice = parseFloat(segment.end_price);
      const type = segment.segment_type;
      
      // Calculate position along the helix
      const t = i / numSegments;
      const angle = 2 * Math.PI * turns * t;
      const y = height * (0.5 - t); // Vertical position
      
      // Calculate points for this segment (rung)
      const x1 = radius * Math.cos(angle);
      const z1 = radius * Math.sin(angle);
      const x2 = radius * Math.cos(angle + Math.PI);
      const z2 = radius * Math.sin(angle + Math.PI);
      
      const pointA = new THREE.Vector3(x1, y, z1);
      const pointB = new THREE.Vector3(x2, y, z2);
      
      // Get color based on segment type
      const color = this.colorMap[type] || 0xd7e5ff;
      
      // Calculate segment properties
      const segmentLength = Math.max(1, endIdx - startIdx);
      const scaleFactor = Math.min(1.5, Math.log(segmentLength) / Math.log(10) + 0.5);
      const pctChange = segment.pct_change;
      
      // Create the horizontal connector (rung) with enhanced materials
      const baseWidth = 0.3 + Math.min(0.5, Math.abs(pctChange) * 0.03); 
      const rungGeometry = new THREE.CylinderGeometry(
        baseWidth * scaleFactor, // top radius
        baseWidth * scaleFactor, // bottom radius
        radius * 2, // height (distance between backbones)
        8, // radial segments
        1, // height segments
        false // open-ended
      );
      
      // Enhanced metallic material with glow effect for better visibility
      const rungMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.5,
        roughness: 0.3,
        emissive: color,
        emissiveIntensity: Math.min(0.4, Math.abs(pctChange) * 0.03 + 0.1), // Increased base intensity
        transparent: true,
        opacity: 0.95
      });
      
      const rung = new THREE.Mesh(rungGeometry, rungMaterial);
      
      // Position the rung at the center between the backbone points
      rung.position.copy(pointA.clone().add(pointB).multiplyScalar(0.5));
      
      // Orient the rung to connect the two backbone points
      // First, make the cylinder's axis align with the direction between points
      rung.lookAt(pointB);
      // Rotate 90 degrees to align cylinder with the direction vector
      rung.rotateX(Math.PI / 2);
      
      // Format detailed segment info for tooltip with enhanced presentation
      rung.userData = {
        info: `<div class="panel-header">
                 <div class="panel-title">${type.toUpperCase()} SEGMENT</div>
               </div>
               <div style="font-size: 11px; opacity: 0.7; margin-bottom: 8px;">SEQUENCE INDEX: ${startIdx}-${endIdx}</div>
               <div style="display: flex; justify-content: space-between; margin: 8px 0; padding: 5px; background: rgba(30, 40, 80, 0.4); border-radius: 3px;">
                 <div>START: $${startPrice.toFixed(2)}</div>
                 <div>→</div>
                 <div>END: $${endPrice.toFixed(2)}</div>
               </div>
               <div style="text-align: center; font-weight: 500; color: ${pctChange > 0 ? '#2CE5A7' : '#E55C7A'}; margin: 10px 0; font-size: 16px; letter-spacing: 0.05em;">${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(2)}%</div>
               <div style="margin-top: 8px; font-size: 11px; opacity: 0.8; border-top: 1px dotted rgba(66, 134, 244, 0.3); padding-top: 8px;">
                 <div>LENGTH: ${segmentLength} UNITS</div>
                 <div style="margin-top: 5px;">${segment.start_time} → ${segment.end_time}</div>
               </div>`
      };
      
      group.add(rung);
      
      // Add enhanced visual effects for significant price changes
      if (Math.abs(pctChange) > 5) {
        const pulseGeometry = new THREE.SphereGeometry(0.8 + Math.abs(pctChange) * 0.05, 16, 16);
        const pulseMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.2
        });
        const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
        pulse.position.copy(rung.position.clone());
        
        // Store animation parameters
        pulse.userData.animationParams = {
          initialScale: 0.5,
          maxScale: 1.0 + Math.abs(pctChange) * 0.02,
          pulseSpeed: 0.6 + Math.random() * 0.4,
          phase: Math.random() * Math.PI * 2
        };
        
        group.add(pulse);
        
        // Add a second, larger pulse for more dramatic effect on important segments
        if (Math.abs(pctChange) > 8) {
          const outerPulseGeometry = new THREE.SphereGeometry(1.0 + Math.abs(pctChange) * 0.08, 16, 16);
          const outerPulseMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.1
          });
          const outerPulse = new THREE.Mesh(outerPulseGeometry, outerPulseMaterial);
          outerPulse.position.copy(rung.position.clone());
          
          outerPulse.userData.animationParams = {
            initialScale: 0.7,
            maxScale: 1.2 + Math.abs(pctChange) * 0.03,
            pulseSpeed: 0.4 + Math.random() * 0.3,
            phase: Math.random() * Math.PI * 2
          };
          
          group.add(outerPulse);
        }
      }
    }
    
    // Ensure the DNA is centered and visible
    group.position.set(0, 0, 0);
    // Add slight initial rotation for better visibility
    group.rotation.y = Math.PI / 6;
    
    this.dnaGroup = group; // Store reference for controls
    this.debugLog("Market genome visualization complete.");
    return group;
  }
  
  /**
   * Add visual effects for significant price changes
   */
  _addSegmentEffects(group, segment, position) {
    const pctChange = segment.pct_change;
    if (Math.abs(pctChange) > 5) {
      const color = this.colorMap[segment.segment_type] || 0xd7e5ff;
      
      const pulseGeometry = new THREE.SphereGeometry(0.8 + Math.abs(pctChange) * 0.05, 16, 16);
      const pulseMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.2
      });
      const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
      pulse.position.copy(position);
      
      pulse.userData.animationParams = {
        initialScale: 0.5,
        maxScale: 1.0 + Math.abs(pctChange) * 0.02,
        pulseSpeed: 0.6 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2
      };
      
      group.add(pulse);
    }
  }

  /**
   * Rebuild the DNA structure with new data
   */
  rebuildDNA(data) {
    this.clearScene();
    const dna = this.createDNAHelix(data);
    this.scene.add(dna);
    this.debugLog(`Genomic structure assembled from ${data.length} segments`);
    return dna;
  }
  
  /**
   * Load and process data from text
   */
  loadFromText(jsonText) {
    this.debugLog("Processing genomic sequence data...");
    
    let rawData;
    try {
      rawData = JSON.parse(jsonText);
      this.debugLog(`Genomic sequence contains ${rawData.length} segment markers`);
    } catch (error) {
      this.debugLog(`ERROR: Failed to parse genetic sequence: ${error.message}`);
      return null;
    }
    
    const data = this.validateData(rawData);
    
    if (data.length === 0) {
      this.debugLog("No valid genomic data to analyze.");
      return null;
    }
    
    this.lastLoadedData = data;
    this.debugLog(`Validated ${data.length} genomic segments.`);
    
    // Get segment counts by type
    const typeCounts = {};
    data.forEach(segment => {
      typeCounts[segment.segment_type] = (typeCounts[segment.segment_type] || 0) + 1;
    });
    
    let countInfo = "Segment distribution: ";
    Object.entries(typeCounts).forEach(([type, count]) => {
      countInfo += `${type}=${count} `;
    });
    this.debugLog(countInfo);
    
    // Filter data based on selected type
    const filteredData = this.filterSegmentsByType(data, this.selectedType);
    this.debugLog(`Building genome with ${filteredData.length} ${this.selectedType} segments`);
    
    return this.rebuildDNA(filteredData);
  }
  
  /**
   * Update the visualization with current settings
   */
  updateVisualization() {
    if (this.lastLoadedData) {
      const filteredData = this.filterSegmentsByType(this.lastLoadedData, this.selectedType);
      this.rebuildDNA(filteredData);
    }
  }
  
  /**
   * Clear the scene of DNA elements
   */
  clearScene() {
    this.debugLog("Clearing the scene...");
    
    if (this.dnaGroup) {
      this.scene.remove(this.dnaGroup);
      this.dnaGroup = null;
    }
    
    this.debugLog("Scene cleared, DNA structure removed");
  }
  
  /**
   * Get the current DNA group
   */
  getDNAGroup() {
    return this.dnaGroup;
  }
  
  /**
   * Get the last loaded data
   */
  getLastLoadedData() {
    return this.lastLoadedData;
  }
  
  /**
   * Calculate statistics from the data
   */
  calculateStats(data = null) {
    const dataToUse = data || this.lastLoadedData;
    if (!dataToUse || dataToUse.length === 0) return null;
    
    const totalSegments = dataToUse.length;
    const typeCounts = {};
    let totalAbsChange = 0;
    
    dataToUse.forEach(segment => {
      typeCounts[segment.segment_type] = (typeCounts[segment.segment_type] || 0) + 1;
      totalAbsChange += Math.abs(segment.pct_change);
    });
    
    const volatility = (totalAbsChange / totalSegments).toFixed(2);
    
    return {
      totalSegments,
      typeCounts,
      volatility: volatility + '%'
    };
  }
  
  /**
   * Debug logging function
   */
  debugLog(message) {
    if (typeof window !== 'undefined' && window.debugLog) {
      window.debugLog(message);
    } else {
      console.log(`[DNAVisualizer] ${message}`);
    }
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DNAVisualizer;
}