const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for ONNX model files and SentencePiece files
config.resolver.assetExts.push('onnx', 'spm');

module.exports = config;