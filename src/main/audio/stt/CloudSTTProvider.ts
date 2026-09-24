import { getLLMClientForAgent } from '../../config/providerRegistry.js'
import { getAgentBinding } from '../../config/settingsStore.js'

export class CloudSTTProvider {
  async transcribeFile(filePath: string): Promise<string> {
    const binding = getAgentBinding('cloudStt')
    const client = getLLMClientForAgent('cloudStt')
    return client.transcribeAudio(filePath, binding.model)
  }
}
