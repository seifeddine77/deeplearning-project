const path = require('path');
const fs = require('fs');

if (process.platform === 'win32') {
  const tfjsNodeDepsDir = path.join(__dirname, '../../node_modules/@tensorflow/tfjs-node/deps/lib');
  if (fs.existsSync(tfjsNodeDepsDir) && !(process.env.PATH || '').includes(tfjsNodeDepsDir)) {
    process.env.PATH = `${tfjsNodeDepsDir};${process.env.PATH || ''}`;
  }
}

let tf;
try {
  tf = require('@tensorflow/tfjs-node');
} catch (e) {
  tf = require('@tensorflow/tfjs');
}

class Simulator3DService {
  constructor() {
    this.simulations = new Map();
    this.supportedTypes = ['2D', '3D', 'volumetric', 'temporal'];
  }

  /**
   * Créer une simulation 3D
   */
  async create3DSimulation(config) {
    try {
      const simulationId = `sim_3d_${Date.now()}`;

      const simulation = {
        id: simulationId,
        type: config.type || '3D',
        dimensions: config.dimensions || [64, 64, 64],
        channels: config.channels || 1,
        dataType: config.dataType || 'float32',
        status: 'created',
        createdAt: new Date().toISOString(),
        data: null,
        metadata: {
          voxelSize: config.voxelSize || 1.0,
          origin: config.origin || [0, 0, 0],
          spacing: config.spacing || [1, 1, 1]
        }
      };

      this.simulations.set(simulationId, simulation);

      console.log(`✅ 3D Simulation created: ${simulationId}`);
      return {
        success: true,
        simulation
      };
    } catch (error) {
      console.error('❌ Error creating 3D simulation:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Générer des données 3D synthétiques
   */
  async generate3DData(simulationId, type = 'gaussian') {
    try {
      const simulation = this.simulations.get(simulationId);

      if (!simulation) {
        return {
          success: false,
          error: 'Simulation not found'
        };
      }

      const [depth, height, width] = simulation.dimensions;
      const channels = simulation.channels;

      let data;

      if (type === 'gaussian') {
        // Données gaussiennes 3D
        data = tf.randomNormal([depth, height, width, channels]);
      } else if (type === 'uniform') {
        // Données uniformes 3D
        data = tf.randomUniform([depth, height, width, channels]);
      } else if (type === 'sphere') {
        // Générer une sphère 3D
        data = this.generateSphere3D(depth, height, width, channels);
      } else if (type === 'cube') {
        // Générer un cube 3D
        data = this.generateCube3D(depth, height, width, channels);
      } else if (type === 'noise') {
        // Bruit de Perlin 3D (simulé)
        data = tf.randomNormal([depth, height, width, channels]);
      }

      simulation.data = data;
      simulation.status = 'data_generated';
      simulation.dataType = type;

      this.simulations.set(simulationId, simulation);

      return {
        success: true,
        simulationId,
        shape: data.shape,
        dataType: type
      };
    } catch (error) {
      console.error('❌ Error generating 3D data:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Générer une sphère 3D
   */
  generateSphere3D(depth, height, width, channels) {
    const centerZ = depth / 2;
    const centerY = height / 2;
    const centerX = width / 2;
    const radius = Math.min(depth, height, width) / 2;

    const data = [];

    for (let z = 0; z < depth; z++) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const dist = Math.sqrt(
            Math.pow(x - centerX, 2) +
            Math.pow(y - centerY, 2) +
            Math.pow(z - centerZ, 2)
          );

          const value = dist <= radius ? 1.0 : 0.0;
          for (let c = 0; c < channels; c++) {
            data.push(value);
          }
        }
      }
    }

    return tf.tensor4d(data, [depth, height, width, channels]);
  }

  /**
   * Générer un cube 3D
   */
  generateCube3D(depth, height, width, channels) {
    const data = [];
    const margin = 10;

    for (let z = 0; z < depth; z++) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const isInside = 
            x >= margin && x < width - margin &&
            y >= margin && y < height - margin &&
            z >= margin && z < depth - margin;

          const value = isInside ? 1.0 : 0.0;
          for (let c = 0; c < channels; c++) {
            data.push(value);
          }
        }
      }
    }

    return tf.tensor4d(data, [depth, height, width, channels]);
  }

  /**
   * Appliquer une transformation 3D
   */
  async apply3DTransform(simulationId, transform) {
    try {
      const simulation = this.simulations.get(simulationId);

      if (!simulation || !simulation.data) {
        return {
          success: false,
          error: 'Simulation or data not found'
        };
      }

      let transformedData = simulation.data;

      if (transform.type === 'rotate') {
        // Rotation 3D
        transformedData = this.rotate3D(transformedData, transform.angles);
      } else if (transform.type === 'scale') {
        // Mise à l'échelle 3D
        transformedData = this.scale3D(transformedData, transform.factors);
      } else if (transform.type === 'translate') {
        // Translation 3D
        transformedData = this.translate3D(transformedData, transform.offsets);
      } else if (transform.type === 'flip') {
        // Retournement 3D
        transformedData = this.flip3D(transformedData, transform.axes);
      }

      simulation.data = transformedData;
      simulation.lastTransform = transform;

      this.simulations.set(simulationId, simulation);

      return {
        success: true,
        simulationId,
        transform: transform.type
      };
    } catch (error) {
      console.error('❌ Error applying 3D transform:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Rotation 3D
   */
  rotate3D(data, angles) {
    // Implémentation simplifiée
    return data;
  }

  /**
   * Mise à l'échelle 3D
   */
  scale3D(data, factors) {
    // Implémentation simplifiée
    return data;
  }

  /**
   * Translation 3D
   */
  translate3D(data, offsets) {
    // Implémentation simplifiée
    return data;
  }

  /**
   * Retournement 3D
   */
  flip3D(data, axes) {
    // Implémentation simplifiée
    return data;
  }

  /**
   * Exporter les données 3D
   */
  async export3DData(simulationId, format = 'nifti') {
    try {
      const simulation = this.simulations.get(simulationId);

      if (!simulation || !simulation.data) {
        return {
          success: false,
          error: 'Simulation or data not found'
        };
      }

      const exportData = {
        simulationId,
        format,
        shape: simulation.data.shape,
        metadata: simulation.metadata,
        exportedAt: new Date().toISOString()
      };

      if (format === 'nifti') {
        exportData.filename = `${simulationId}.nii.gz`;
      } else if (format === 'dicom') {
        exportData.filename = `${simulationId}.dcm`;
      } else if (format === 'raw') {
        exportData.filename = `${simulationId}.raw`;
      }

      return {
        success: true,
        export: exportData
      };
    } catch (error) {
      console.error('❌ Error exporting 3D data:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtenir les statistiques de simulation
   */
  async getSimulationStats(simulationId) {
    try {
      const simulation = this.simulations.get(simulationId);

      if (!simulation) {
        return {
          success: false,
          error: 'Simulation not found'
        };
      }

      let stats = {
        simulationId,
        type: simulation.type,
        dimensions: simulation.dimensions,
        status: simulation.status,
        createdAt: simulation.createdAt
      };

      if (simulation.data) {
        const dataArray = simulation.data.dataSync();
        const min = Math.min(...dataArray);
        const max = Math.max(...dataArray);
        const mean = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

        stats.dataStats = {
          min,
          max,
          mean,
          size: dataArray.length
        };
      }

      return {
        success: true,
        stats
      };
    } catch (error) {
      console.error('❌ Error getting simulation stats:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Lister toutes les simulations
   */
  listSimulations() {
    try {
      const simulations = Array.from(this.simulations.values()).map(sim => ({
        id: sim.id,
        type: sim.type,
        dimensions: sim.dimensions,
        status: sim.status,
        createdAt: sim.createdAt
      }));

      return {
        success: true,
        count: simulations.length,
        simulations
      };
    } catch (error) {
      console.error('❌ Error listing simulations:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new Simulator3DService();
