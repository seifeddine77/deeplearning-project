# Datasets (generated)

This folder contains sample datasets you can use in the UI.

## Generate everything

From the project root:

```bash
node server/scripts/generate-all-datasets.js
```

This creates:

- `datasets/tabular/`
- `datasets/sequence/`
- `datasets/image/`

Each category includes `easy`, `medium`, and `hard` variants (more overlap/noise as difficulty increases) so you don't always get 100% accuracy.

## Suggested UI settings

- Tabular CSV:
  - Dataset Type: `tabular`

- Sequence CSV:
  - Dataset Type: `sequence`
  - Timesteps: 50 (try 30/50/100)
  - Stride: 1 (try 1/5)

- Image ZIP:
  - Dataset Type: `image`

## Files

### Tabular

- `tabular_easy.csv`
- `tabular_medium.csv`
- `tabular_hard.csv`

### Sequence

- `sequence_easy.csv`
- `sequence_medium.csv`
- `sequence_hard.csv`

### Image

- `image_easy.zip`
- `image_medium.zip`
- `image_hard.zip`

## MNIST / CIFAR-10 (download + convert)

These scripts download the real datasets and convert them into a single ZIP with `className/*.png` structure.

MNIST (default: `maxPerClass=600`, includes test):

```bash
node server/scripts/download-mnist-zip.js datasets/image/mnist.zip 600 1
```

CIFAR-10 (default: `maxPerClass=1000`, includes test):

```bash
node server/scripts/download-cifar10-zip.js datasets/image/cifar10.zip 1000 1
```

Resulting files:

- `datasets/image/mnist.zip`
- `datasets/image/cifar10.zip`

