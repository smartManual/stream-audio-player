import { AudioType } from './utils/const'
import EventEmitter from 'events'

interface PlayerConfig {
  /**
   * 数据类型
   */
  type: AudioType.pcm | AudioType.mp3 | AudioType.wav,
  /**
   * 采样率
   */
  sampleRate: number,
  /**
   * 声道数
   */
  channels: 1 | 2,
  /**
   * 位深
   */
  bitDepth: 8 | 16 | 32,
  /**
   * 缓存时间
   */
  flushTime: number
}

interface IConfig {
  /**
   * 数据类型
   */
  type?: AudioType.pcm | AudioType.mp3 | AudioType.wav,
  /**
   * 采样率
   */
  sampleRate?: number,
  /**
   * 声道数
   */
  channels?: 1 | 2,
  /**
   * 位深
   */
  bitDepth?: 8 | 16 | 32
}

type TimerHandle = ReturnType<typeof setTimeout>;

const DefConfig: PlayerConfig = {
  type: AudioType.pcm,
  sampleRate: 16000,
  channels: 1,
  bitDepth: 16,
  flushTime: 200
}

const ArrayMax = {
  '8': 128.0,
  '16': 32768.0,
  '32': 2147483648
}

class StreamAudioPlayer {
  private audioContext: AudioContext | null = new (window.AudioContext || (window as any).webkitAudioContext)()
  private config: PlayerConfig = DefConfig
  private bufferCache: Float32Array | null = new Float32Array()
  private audioBufferCache: AudioBuffer[] = []
  private startTime: number = 0
  private timer: TimerHandle | undefined
  private observer: any
  private _params: any = {}
  //
  public on:any = null
  public off: any = null
  public once: any = null
  public trigger: any = null
  constructor(config: IConfig = DefConfig) {
    this.config = Object.assign({}, this.config, config)

    let observer: any = this.observer = new EventEmitter()
    observer.trigger = function trigger (event: any, ...data: any) {
      observer.emit(event, event, ...data);
    };

    observer.off = function off (event: any, ...data: any) {
      observer.removeListener(event, ...data);
    };
    this.on = observer.on.bind(observer)
    this.off = observer.off.bind(observer)
    this.once = observer.once.bind(observer)
    this.trigger = observer.trigger.bind(observer)

    this.timer = setInterval(this.flush.bind(this), this.config.flushTime)
  }

  get isPlaying() {
    return false
  }

  public static removeBase64Prefix(base64String: string) {
    return base64String.replace(/^data:[^;]+;base64,/, '')
  }

  public static base64ToArrayBuffer(base64String: string): ArrayBuffer {
    if (!base64String) {
      throw new Error('param base64String is required')
    }

    base64String = StreamAudioPlayer.removeBase64Prefix(base64String)

    const binary = window.atob(base64String)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }

    return bytes.buffer
  }

  get params() {
    return this._params
  }

  set params(params: any) {
    this._params = Object.assign({}, this._params, params)
  }

  /**
   * 将pcm数据转换为float32数据
   * @param arrayBuffer pcm数据
   * @returns float32数据
   */
  convertPCMToFloat32(arrayBuffer: ArrayBuffer) {
    let data
    if (this.config.bitDepth === 8) {
      data = new Int8Array(arrayBuffer)
    } else if (this.config.bitDepth === 16) {
      data = new Int16Array(arrayBuffer)
    } else if (this.config.bitDepth === 32) {
      data = new Int32Array(arrayBuffer)
    } else {
      throw new Error('bitDepth param is invalid')
    }

    let float32Array = new Float32Array(data.length)
    for (let i = 0; i < data.length; i++) {
      float32Array[i] = data[i] / ArrayMax[this.config.bitDepth]
    }

    return float32Array
  }

  addData(arrayBuffer: ArrayBuffer) {
    if ([AudioType.pcm].includes(this.config.type)) {
      const float32Data = this.convertPCMToFloat32(arrayBuffer)
      
      const tmp = new Float32Array(this.bufferCache!.length + float32Data.length)
      tmp.set(this.bufferCache!, 0)
      tmp.set(float32Data, this.bufferCache!.length)
      this.bufferCache = tmp
    } else if ([AudioType.mp3, AudioType.wav].includes(this.config.type)) {
      this.audioContext!.decodeAudioData(arrayBuffer).then((audioBuffer: AudioBuffer) => {
        this.audioBufferCache.push(audioBuffer)
      })
    }
  }

  concatAudioBuffers(audioBuffers: AudioBuffer[]): AudioBuffer {
    // 计算总长度
    const totalLength = audioBuffers.reduce((sum, buffer) => sum + buffer.length, 0);
    
    // 获取第一个buffer的声道数和采样率
    const numberOfChannels = audioBuffers[0].numberOfChannels;
    const sampleRate = audioBuffers[0].sampleRate;
    
    // 创建新的buffer
    const newBuffer = this.audioContext!.createBuffer(
      numberOfChannels, 
      totalLength, 
      sampleRate
    );
    
    // 逐个填充数据
    let offset = 0;
    for (const buffer of audioBuffers) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const channelData = newBuffer.getChannelData(channel);
        const bufferChannelData = buffer.getChannelData(channel);
        channelData.set(bufferChannelData, offset);
      }
      offset += buffer.length;
    }
    
    return newBuffer;
  }

  getAudioBuffer(): AudioBuffer  | null {
    if ([AudioType.pcm].includes(this.config.type)) {
      if (!this.bufferCache!.length) {
        return null
      }
  
      const length = this.bufferCache!.length / this.config.channels
  
      const audioBuffer = this.audioContext!.createBuffer(this.config.channels, length, this.config.sampleRate)
      for (let channel = 0; channel < this.config.channels; channel++) {
        const channelData = audioBuffer.getChannelData(channel)
  
        let offset = channel
        for (let i = 0; i < length; i++) {
          channelData[i] = this.bufferCache![offset]
          offset += this.config.channels
        }
      }
      if (this.startTime < this.audioContext!.currentTime) {
        this.startTime = this.audioContext!.currentTime
      }
  
      return audioBuffer
    } else if ([AudioType.mp3, AudioType.wav].includes(this.config.type)) {
      if (this.audioBufferCache.length > 0) {
        return this.audioBufferCache.shift() as any
      } else {
        return null
      }
    } else {
      return null
    }
  }

  flush() {
    const audioBuffer = this.getAudioBuffer()
    if (audioBuffer === null) {
      return
    }
    
    if (this.startTime < this.audioContext!.currentTime) {
      this.startTime = this.audioContext!.currentTime
    }

    const audioBufferSourceNode = this.audioContext!.createBufferSource()
    audioBufferSourceNode.buffer = audioBuffer
    audioBufferSourceNode.connect(this.audioContext!.destination)
    audioBufferSourceNode.start(this.startTime)
   
    audioBufferSourceNode.onended = ((params: any) => {
      this.trigger('onended', params)
    }).bind(this, this.params)
    this.startTime += audioBuffer.duration
    this.bufferCache = new Float32Array()
  }

  pause() {
    return this.audioContext!.suspend()
  }

  resume() {
    return this.audioContext!.resume()
  }

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
  }

  stop() {
    this.clearTimer()
    this.bufferCache = null
    this.audioBufferCache = []
    
    this.audioContext!.close()
    this.audioContext = null
    
    this.observer.removeAllListeners()
    this.observer = null
  }
}

export default StreamAudioPlayer

