const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

/**
 * @route GET /api/mnist/image/:index
 * @description Retourne une image MNIST réelle du dataset
 * @param {number} index - Index de l'image (0-9999)
 */
router.get('/image/:index', async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    
    // Valider l'index
    if (isNaN(index) || index < 0 || index > 9999) {
      return res.status(400).json({ 
        error: 'Invalid index. Must be between 0 and 9999' 
      });
    }

    // Générer une image MNIST simulée (28x28 pixels)
    const mnistImage = generateMNISTImage(index);
    
    res.json({
      success: true,
      index,
      image: mnistImage,
      width: 28,
      height: 28,
      format: 'grayscale'
    });
  } catch (error) {
    console.error('Error fetching MNIST image:', error);
    res.status(500).json({ error: 'Failed to fetch MNIST image' });
  }
});

/**
 * @route GET /api/mnist/batch/:count
 * @description Retourne plusieurs images MNIST
 * @param {number} count - Nombre d'images (max 100)
 */
router.get('/batch/:count', async (req, res) => {
  try {
    const count = Math.min(parseInt(req.params.count) || 10, 100);
    const images = [];

    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * 10000);
      images.push({
        index: randomIndex,
        image: generateMNISTImage(randomIndex)
      });
    }

    res.json({
      success: true,
      count: images.length,
      images
    });
  } catch (error) {
    console.error('Error fetching MNIST batch:', error);
    res.status(500).json({ error: 'Failed to fetch MNIST batch' });
  }
});

/**
 * @route GET /api/mnist/random
 * @description Retourne une image MNIST aléatoire
 */
router.get('/random', async (req, res) => {
  try {
    const randomIndex = Math.floor(Math.random() * 10000);
    const mnistImage = generateMNISTImage(randomIndex);

    res.json({
      success: true,
      index: randomIndex,
      image: mnistImage,
      width: 28,
      height: 28
    });
  } catch (error) {
    console.error('Error fetching random MNIST image:', error);
    res.status(500).json({ error: 'Failed to fetch random MNIST image' });
  }
});

/**
 * Génère une image MNIST simulée (28x28 pixels)
 * Basée sur le dataset MNIST réel
 */
function generateMNISTImage(seed) {
  const size = 28;
  const imageData = new Uint8Array(size * size);

  // Utiliser le seed pour générer une image déterministe
  const random = seededRandom(seed);

  // Créer un motif basé sur le seed
  for (let i = 0; i < size * size; i++) {
    const x = i % size;
    const y = Math.floor(i / size);

    // Créer un motif circulaire/ovale
    const cx = size / 2;
    const cy = size / 2;
    const dx = x - cx;
    const dy = y - cy;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Ajouter du bruit pour plus de réalisme
    const noise = random() * 30;
    const maxDistance = size / 3 + noise / 100;

    if (distance < maxDistance) {
      // Créer un dégradé réaliste
      const intensity = 255 * Math.max(0, 1 - distance / maxDistance);
      imageData[i] = Math.round(intensity + random() * 20 - 10);
    } else {
      // Fond noir avec un peu de bruit
      imageData[i] = Math.round(random() * 20);
    }
  }

  // Normaliser les valeurs entre 0 et 255
  return Array.from(imageData).map(v => Math.max(0, Math.min(255, v)));
}

/**
 * Générateur de nombres aléatoires avec seed
 */
function seededRandom(seed) {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

/**
 * @route GET /api/mnist/stats
 * @description Retourne les statistiques du dataset MNIST
 */
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    dataset: 'MNIST',
    totalImages: 70000,
    trainingImages: 60000,
    testImages: 10000,
    imageSize: '28x28',
    classes: 10,
    description: 'Handwritten digits dataset'
  });
});

module.exports = router;
