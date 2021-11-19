import { parentPort, workerData } from 'worker_threads';
import { runMocha } from '../Helpers';

runMocha(workerData.filename, { ...workerData.mochaOptions, isWorker: true, mochaConfigPath: workerData.mochaConfigPath }).then(parentPort?.postMessage)
