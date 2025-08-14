import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

export async function initBackend() {
  await tf.setBackend('webgl');
  await tf.ready();
}