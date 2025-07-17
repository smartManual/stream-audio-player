# @zero-org/stream-audio-player

音频流式播放库，支持 PCM/MP3/WAV/BASE64 格式的实时解码与播放。适用于 Web 音频应用开发。

## ✨ 特性
- 实时音频流处理
- 多格式支持 (PCM/MP3/WAV/BASE64)
- 轻量级无依赖设计
- TypeScript 类型支持
- 事件驱动播放控制

## 📦 安装
```bash
npm install @zero-org/stream-audio-player
```

## 🚀 快速开始
```javascript
import StreamAudioPlayer from '@zero-org/stream-audio-player';

// 初始化播放器（带配置参数）
const player = new StreamAudioPlayer({
  type: 'pcm',       // 音频类型：pcm/mp3/wav
  sampleRate: 16000, // 采样率
  channels: 1,       // 声道数
  bitDepth: 16       // 位深
});
const pcmData = await fetch('rec-6834ms-16kbps-16000hz.pcm').then(res => res.arrayBuffer())
// 可以为每段音频设置参数，在onended事件中就能拿到对应的参数
player.params = {
    uuid: '001',
    type: 'test'
}
player.addData(pcmData)
// 监听播放结束事件
player.on('onended', (eventName, params) => {
  console.log('播放结束', eventName, params); // 播放结束 onended {uuid: '001', name: 'test'}
});

// 播放pcm类型音频
const player = new StreamAudioPlayer()
const pcmData = await fetch('rec-6834ms-16kbps-16000hz.pcm').then(res => res.arrayBuffer())
player.addData(pcmData)

// 播放mp3类型音频
const player = new StreamAudioPlayer({ type: 'mp3' })
const mp3Data = await axios.get('rec-3327ms-16kbps-16000hz.mp3', {
    responseType: 'arraybuffer'
}).then(res => res.data)
player.addData(mp3Data)

// 播放wav类型音频
const player = new StreamAudioPlayer({ type: 'wav' })
const wavData = await axios.get('rec-3327ms-16kbps-16000hz.wav', {
    responseType: 'arraybuffer'
}).then(res => res.data)
player.addData(wavData)

// 播放base64类型音频
const player = new StreamAudioPlayer({ type: 'pcm' })
const base64 = 'data:audio/pcm;base64,9P+f/wkAIADW/3v/8/+tAN......'
const data = StreamAudioPlayer.base64ToArrayBuffer(base64)
player.addData(data)

// 控制播放
player.pause();  // 暂停播放
player.resume(); // 恢复播放
player.stop();   // 停止并释放资源
```

## ⚙️ 配置参数
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `'pcm'|'mp3'|'wav'` | `'pcm'` | 音频格式 |
| `sampleRate` | `number` | `16000` | 采样率(Hz) |
| `channels` | `1|2` | `1` | 声道数 |
| `bitDepth` | `8|16|32` | `16` | 位深度，type为pcm时是必须的 |
| flushTime | `number` | 200 | 缓存音频的时间，单位毫秒 |

## 📡 API 方法
### `addData(arrayBuffer: ArrayBuffer)`
添加音频数据到播放缓冲区
**参数**：
- `arrayBuffer`：音频二进制数据

  

### `pause(): Promise<void>`
暂停播放



### `resume(): Promise<void>`

恢复暂停的播放



### `stop(): void`
停止播放并释放所有资源



### `on(event: string, callback: Function)`
监听播放器事件
**事件类型**：
- `onended`：播放结束事件

  

### `static base64ToArrayBuffer(base64: string): ArrayBuffer`
Base64转二进制数据（工具方法）

## 📄 许可
MIT © [jjzuo]()

