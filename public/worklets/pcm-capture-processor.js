class PCMCaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const opts = (options && options.processorOptions) || {};
    this.targetSampleRate = opts.targetSampleRate || 24000;
    this.ratio = sampleRate / this.targetSampleRate;
  }

  process(inputs) {
    const input = inputs[0];
    const channelData = input && input[0];
    if (!channelData || channelData.length === 0) return true;

    const outLength = Math.floor(channelData.length / this.ratio);
    if (outLength <= 0) return true;

    const out = new Int16Array(outLength);
    for (let i = 0; i < outLength; i++) {
      const srcIndex = i * this.ratio;
      const idx0 = Math.floor(srcIndex);
      const idx1 = Math.min(idx0 + 1, channelData.length - 1);
      const frac = srcIndex - idx0;
      const sample = channelData[idx0] * (1 - frac) + channelData[idx1] * frac;
      const clamped = Math.max(-1, Math.min(1, sample));
      out[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    }

    this.port.postMessage(out.buffer, [out.buffer]);
    return true;
  }
}

registerProcessor('pcm-capture-processor', PCMCaptureProcessor);
