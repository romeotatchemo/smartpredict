import * as tf from '@tensorflow/tfjs';

export function runSanityCheck() {
    const tensor = tf.tensor([1, 2, 3, 4]);
    tensor.print();

    const result = tensor.mul(2);
    result.print();
    tensor.dispose();
    result.dispose();
}