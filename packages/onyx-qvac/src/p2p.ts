import { loadModel } from './model-manager.js';

export async function connectPeer(peerLink: string): Promise<string> {
    console.log(`Connecting to QVAC P2P node: ${peerLink}`);
    // Loads model from Holepunch P2P link
    return await loadModel(peerLink);
}
