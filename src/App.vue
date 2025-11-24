<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'

// --- 类型定义 ---
interface AdviceData {
    score: string
    roast: string
    advice: string[]
}

// --- 状态管理 ---
const currentFacingMode = ref<'user' | 'environment'>('user')
const isUsingCamera = ref(true)
const appState = ref<'camera' | 'analyzing' | 'result'>('camera')
const isMentorMode = ref(false)

// 绑定 DOM 元素
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// 数据状态
const stream = ref<MediaStream | null>(null)
const capturedImage = ref<string>('') // 最终用于显示的图片 Base64
const scanStatusText = ref('INITIALIZING...')
const toastMessage = ref('')
const showToast = ref(false)

// AI 结果数据
const resultData = ref<AdviceData | null>(null)
// 打字机效果显示的文本
const displayedRoastText = ref('')

// --- 1. 摄像头逻辑 ---

const initCamera = async () => {
    // 停止旧流
    if (stream.value) {
        stream.value.getTracks().forEach(track => track.stop())
    }

    try {
        const constraints = {
            video: {
                facingMode: currentFacingMode.value,
                width: { ideal: 1280 },
                height: { ideal: 1920 }
            },
            audio: false
        }

        stream.value = await navigator.mediaDevices.getUserMedia(constraints)

        if (videoRef.value) {
            videoRef.value.srcObject = stream.value
            // 必须显式 play，防止部分浏览器黑屏
            videoRef.value.play()
        }

        isUsingCamera.value = true
        triggerToast(currentFacingMode.value === 'user' ? '自拍模式' : '后摄模式')
    } catch (err) {
        console.error('Camera Error:', err)
        alert('无法访问摄像头')
    }
}

const toggleCamera = () => {
    currentFacingMode.value = currentFacingMode.value === 'user' ? 'environment' : 'user'
    initCamera()
}

// 停止相机流（用于省电或切换到上传模式时）
const stopCamera = () => {
    if (stream.value) {
        stream.value.getTracks().forEach(track => track.stop())
        stream.value = null
    }
}

// 组件卸载时清理
onUnmounted(() => {
    stopCamera()
})

// --- 2. 图片上传逻辑 ---

const triggerUpload = () => {
    fileInputRef.value?.click()
}

const handleFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement
    if (input.files && input.files[0]) {
        const reader = new FileReader()
        reader.onload = e => {
            if (e.target?.result) {
                capturedImage.value = e.target.result as string
                isUsingCamera.value = false
                stopCamera() // 上传图片后停止摄像头流
            }
        }
        reader.readAsDataURL(input.files[0])
    }
}

// --- 3. 拍照/处理逻辑 ---

const captureOrProcess = () => {
    if (!canvasRef.value) return
    const ctx = canvasRef.value.getContext('2d')
    if (!ctx) return

    if (isUsingCamera.value && videoRef.value) {
        // 拍照模式
        const video = videoRef.value
        canvasRef.value.width = video.videoWidth
        canvasRef.value.height = video.videoHeight

        // 镜像处理：如果是前置摄像头，需要翻转绘制
        if (currentFacingMode.value === 'user') {
            ctx.translate(canvasRef.value.width, 0)
            ctx.scale(-1, 1)
        }
        ctx.drawImage(video, 0, 0, canvasRef.value.width, canvasRef.value.height)
        capturedImage.value = canvasRef.value.toDataURL('image/jpeg')
    } else {
        // 上传模式，capturedImage 已经是 base64，不需要额外 canvas 处理，直接进入分析
        // (为了逻辑统一，真实项目可能需要在这里压缩图片)
    }

    startAnalysis()
}

// --- 4. 分析动画与 Mock 数据 ---

const startAnalysis = () => {
    appState.value = 'analyzing'
    const steps = ['SCANNING OUTFIT...', 'DETECTING FABRIC...', 'JUDGING TASTE...', 'GENERATING ROAST...']
    let stepIndex = 0
    scanStatusText.value = steps[0]

    const interval = setInterval(() => {
        stepIndex++
        if (stepIndex < steps.length) {
            scanStatusText.value = steps[stepIndex]
        }
    }, 600)

    setTimeout(() => {
        clearInterval(interval)
        finishAnalysis()
    }, 2500)
}

const finishAnalysis = () => {
    resultData.value = getMockResult()
    appState.value = 'result'
    // 重置 UI 状态
    isMentorMode.value = false
    // 启动打字机
    typeWriter(resultData.value.roast)
}

// --- 5. 结果页逻辑 ---

const activateMentorMode = () => {
    isMentorMode.value = true
}

const resetApp = () => {
    appState.value = 'camera'
    displayedRoastText.value = ''
    // 如果之前是摄像头模式，重新打开摄像头
    if (isUsingCamera.value || !capturedImage.value) {
        initCamera()
    } else {
        // 保持上传模式，不重新 initCamera，但用户可以点上传按钮切图
    }
}

// 打字机效果
const typeWriter = (text: string) => {
    displayedRoastText.value = ''
    let i = 0
    const speed = 20

    const type = () => {
        if (i < text.length) {
            displayedRoastText.value += text.charAt(i)
            i++
            setTimeout(type, speed)
        }
    }
    type()
}

// Mock 数据
const getMockResult = (): AdviceData => {
    const data: AdviceData[] = [
        {
            score: 'C-',
            roast: '这身穿搭展现了一种令人困惑的自信。上衣的颜色和你的肤色在打架，而裤子松垮得像是在向地心引力投降。整体看起来就像是一个还没睡醒的大学生匆忙赶早八。',
            advice: [
                '提升精神气：把上衣塞进去，或者换一件修身一点的版型。',
                '色彩管理：全身上下颜色有点杂，试着把鞋子换成和上衣呼应的颜色。',
                '细节加分：戴个帽子或者整理一下发型，让整体看起来是‘刻意慵懒’而不是‘真邋遢’。'
            ]
        },
        {
            score: 'F',
            roast: '视觉污染级别。这件外套是在和里面的卫衣比丑吗？你成功的避开了所有时尚的可能性，创造了一种全新的‘路人甲’风格。',
            advice: ['立刻脱掉：这件外套不适合你，换成纯黑色的夹克。', '制造层次：内搭太长了，把它卷起来露出一点腰线。', '鞋子也是败笔：换一双干净的小白鞋或者马丁靴。']
        },
        {
            score: 'D',
            roast: '典型的‘用力过猛’。身上的 Logo 太多了，你是想当行走的广告牌吗？这种混搭风格很大胆，但并不是好的那种大胆。',
            advice: ['做减法：全身上下只保留一个重点 Logo，其他的换成素色。', '统一色调：裤子颜色太跳跃，换成深灰或牛仔蓝。', '自信一点：你的姿态比衣服更僵硬，放松肩膀。']
        }
    ]
    return data[Math.floor(Math.random() * data.length)]
}

// Toast 辅助
const triggerToast = (msg: string) => {
    toastMessage.value = msg
    showToast.value = true
    setTimeout(() => (showToast.value = false), 1500)
}

// 启动
onMounted(() => {
    initCamera()
})

// 计算属性：动态样式
const videoTransform = computed(() => {
    return currentFacingMode.value === 'user' ? 'scaleX(-1)' : 'none'
})

const scoreColor = computed(() => {
    if (!resultData.value) return '#ff3b30'
    if (isMentorMode.value) return '#00d2d3' // 导师模式青色

    // 毒舌模式根据分数变色 (Mock逻辑)
    const score = resultData.value.score
    if (score.includes('F') || score.includes('D')) return '#ff3b30' // Red
    return '#ff9f43' // Orange
})
</script>

<template>
    <div class="app-container">
        <!-- 隐藏的文件输入 -->
        <input type="file" ref="fileInputRef" accept="image/*" @change="handleFileChange" style="display: none" />

        <!-- 隐藏的 Canvas 用于截图 -->
        <canvas ref="canvasRef" style="display: none"></canvas>

        <!-- 顶部标题 -->
        <header class="app-header">
            <div class="title-main">OOTD JUDGE</div>
            <div class="title-sub">AI 毒舌穿搭审判</div>
        </header>

        <!-- 主视口区域 -->
        <main class="camera-wrapper">
            <!-- 1. 摄像头视频流 -->
            <video v-if="isUsingCamera" ref="videoRef" autoplay playsinline :style="{ transform: videoTransform }"></video>

            <!-- 2. 图片预览 (上传模式) -->
            <img v-else-if="capturedImage && appState === 'camera'" :src="capturedImage" class="preview-img" alt="Preview" />

            <!-- 3. 取景框 UI (仅在 Camera 或 Analyzing 状态显示) -->
            <div class="viewfinder-ui" v-if="appState !== 'result'">
                <div class="border-corner tl"></div>
                <div class="border-corner tr"></div>
                <div class="border-corner bl"></div>
                <div class="border-corner br"></div>

                <!-- Toast 提示 -->
                <div class="top-toast" :class="{ show: showToast }">{{ toastMessage }}</div>
            </div>

            <!-- 4. HUD 分析动画层 -->
            <div class="analyzing-overlay" v-if="appState === 'analyzing'">
                <div class="scan-grid"></div>
                <div class="scan-bar"></div>
                <div class="status-text">{{ scanStatusText }}</div>
            </div>

            <!-- 5. 结果卡片层 -->
            <div class="result-card" v-if="appState === 'result'">
                <div class="result-img-box" :class="{ 'mentor-border': isMentorMode }">
                    <img :src="capturedImage" />
                    <div class="badge-score" :class="{ 'mentor-badge': isMentorMode }" :style="{ background: scoreColor }">
                        {{ resultData?.score }}
                    </div>
                </div>

                <div class="result-content">
                    <div class="report-header">
                        <span>JUDGMENT REPORT</span>
                        <span class="mode-label" :style="{ color: isMentorMode ? '#00d2d3' : '#666' }">
                            {{ isMentorMode ? '✨ STYLE MENTOR' : '🤖 ROAST MODE' }}
                        </span>
                    </div>

                    <!-- 毒舌文案 -->
                    <div class="text-area" v-if="!isMentorMode">
                        <p class="roast-text">{{ displayedRoastText }}</p>
                    </div>

                    <!-- 导师建议列表 -->
                    <div class="advice-list" v-else>
                        <div v-for="(tip, index) in resultData?.advice" :key="index" class="advice-item fade-in" :style="{ animationDelay: `${index * 0.1}s` }">
                            <span class="tip-index">Tip {{ index + 1 }}:</span> {{ tip }}
                        </div>
                    </div>

                    <!-- 求教按钮 -->
                    <button v-if="!isMentorMode" class="btn-help" @click="activateMentorMode">🥺 被骂哭了？求求 AI 教我... <span>👉</span></button>

                    <div class="btn-group">
                        <button class="action-btn" @click="resetApp">RETRY / 再来一次</button>
                    </div>
                </div>
            </div>
        </main>

        <!-- 底部控制栏 (仅在非结果页显示) -->
        <footer class="controls" v-if="appState !== 'result'">
            <button class="icon-btn" @click="triggerUpload">
                <!-- Gallery Icon -->
                <svg viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" /></svg>
            </button>

            <button class="shutter-btn" @click="captureOrProcess"></button>

            <button class="icon-btn" @click="toggleCamera">
                <!-- Switch Camera Icon -->
                <svg viewBox="0 0 24 24">
                    <path
                        d="M20 4h-3.17L15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 11.5V13H9v2.5L5.5 12 9 8.5V11h6V8.5l3.5 3.5-3.5 3.5z"
                    />
                </svg>
            </button>
        </footer>
    </div>
</template>

<style scoped>
/* CSS 变量定义在 :root 在 SFC 中需要穿透或者直接定义在顶层容器 */
.app-container {
    --primary: #000000;
    --text: #ffffff;
    --accent: #ff3b30;
    --accent-mentor: #00d2d3;
    --cyan: #00f2ff;
    --font-mono: 'Courier New', monospace;
    --font-serif: 'Times New Roman', serif;

    width: 100vw;
    height: 100vh;
    background-color: var(--primary);
    color: var(--text);
    font-family: var(--font-mono);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

/* Header */
.app-header {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 80px;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), transparent);
    z-index: 25;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    pointer-events: none;
    padding-top: 10px;
}
.title-main {
    font-family: var(--font-serif);
    font-weight: 900;
    font-size: 1.8rem;
    letter-spacing: 4px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}
.title-sub {
    font-size: 0.7rem;
    color: var(--accent);
    letter-spacing: 2px;
    margin-top: 2px;
    text-transform: uppercase;
    background: rgba(0, 0, 0, 0.6);
    padding: 2px 6px;
    border-radius: 4px;
}

/* Camera Wrapper */
.camera-wrapper {
    position: relative;
    flex: 1;
    width: 100%;
    overflow: hidden;
    background: #111;
}
video,
.preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.preview-img {
    object-fit: contain;
    background: black;
}

/* Viewfinder UI */
.viewfinder-ui {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 10;
}
.border-corner {
    position: absolute;
    width: 30px;
    height: 30px;
    border: 2px solid rgba(255, 255, 255, 0.6);
}
.tl {
    top: 90px;
    left: 20px;
    border-width: 2px 0 0 2px;
}
.tr {
    top: 90px;
    right: 20px;
    border-width: 2px 2px 0 0;
}
.bl {
    bottom: 20px;
    left: 20px;
    border-width: 0 0 2px 2px;
}
.br {
    bottom: 20px;
    right: 20px;
    border-width: 0 2px 2px 0;
}

.top-toast {
    position: absolute;
    top: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.6);
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    letter-spacing: 1px;
    opacity: 0;
    transition: opacity 0.3s;
}
.top-toast.show {
    opacity: 1;
}

/* Analyzing HUD */
.analyzing-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(5px);
    z-index: 30;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}
.scan-grid {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(rgba(0, 242, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 242, 255, 0.1) 1px, transparent 1px);
    background-size: 40px 40px;
    animation: gridScroll 20s linear infinite;
}
@keyframes gridScroll {
    from {
        background-position: 0 0;
    }
    to {
        background-position: 0 100%;
    }
}
.scan-bar {
    position: absolute;
    width: 100%;
    height: 5px;
    background: var(--cyan);
    box-shadow: 0 0 15px var(--cyan);
    animation: scanMove 2s ease-in-out infinite;
}
@keyframes scanMove {
    0% {
        top: 0%;
    }
    50% {
        top: 100%;
    }
    100% {
        top: 0%;
    }
}
.status-text {
    color: var(--cyan);
    font-size: 1.2rem;
    font-weight: bold;
    z-index: 2;
    background: rgba(0, 0, 0, 0.8);
    padding: 10px 20px;
    border: 1px solid var(--cyan);
}

/* Result Card */
.result-card {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #111;
    z-index: 40;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.3s ease-out;
}
@keyframes slideIn {
    from {
        transform: translateY(100%);
    }
    to {
        transform: translateY(0);
    }
}

.result-img-box {
    flex: 5;
    position: relative;
    overflow: hidden;
    border-bottom: 4px solid var(--accent);
    transition: border-color 0.5s;
}
.result-img-box.mentor-border {
    border-bottom-color: var(--accent-mentor);
}
.result-img-box img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.badge-score {
    position: absolute;
    bottom: -30px;
    right: 20px;
    width: 100px;
    height: 100px;
    color: white;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 3rem;
    font-family: var(--font-serif);
    font-weight: bold;
    border: 4px solid white;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
    transform: rotate(-10deg);
    z-index: 5;
    transition: all 0.5s;
}
.badge-score.mentor-badge {
    transform: rotate(0deg);
}

.result-content {
    flex: 5;
    background: white;
    color: black;
    padding: 40px 25px 30px 25px;
    display: flex;
    flex-direction: column;
}
.report-header {
    font-size: 0.8rem;
    color: #666;
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
}
.text-area,
.advice-list {
    flex-grow: 1;
    overflow-y: auto;
    margin-bottom: 10px;
}
.roast-text {
    font-size: 1.1rem;
    line-height: 1.6;
    font-weight: 600;
}

.advice-item {
    margin-bottom: 10px;
    border-bottom: 1px dashed #eee;
    padding-bottom: 5px;
    font-size: 0.95rem;
}
.tip-index {
    color: var(--accent-mentor);
    font-weight: bold;
}
.fade-in {
    animation: fadeIn 0.5s forwards;
    opacity: 0;
    transform: translateY(10px);
}
@keyframes fadeIn {
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.btn-help {
    width: 100%;
    padding: 14px;
    margin-bottom: 20px;
    background: #f8f8f8;
    border: none;
    border-left: 4px solid var(--accent);
    text-align: left;
    font-weight: bold;
    color: #555;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    font-family: inherit;
}
.btn-help:active {
    background: #eee;
}

.btn-group {
    display: flex;
    margin-top: auto;
}
.action-btn {
    width: 100%;
    padding: 18px;
    border: none;
    font-weight: 900;
    font-size: 1rem;
    letter-spacing: 2px;
    cursor: pointer;
    background: black;
    color: white;
    text-transform: uppercase;
    font-family: inherit;
}
.action-btn:active {
    background: #333;
}

/* Controls Footer */
.controls {
    height: 140px;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    justify-content: space-around;
    align-items: center;
    z-index: 20;
    padding-bottom: 20px;
    border-top: 1px solid #222;
}
.icon-btn {
    background: transparent;
    border: none;
    padding: 15px;
    cursor: pointer;
    opacity: 0.8;
    transition: transform 0.1s;
}
.icon-btn:active {
    transform: scale(0.9);
    opacity: 1;
}
.icon-btn svg {
    width: 28px;
    height: 28px;
    fill: white;
}

.shutter-btn {
    width: 76px;
    height: 76px;
    border-radius: 50%;
    border: 4px solid white;
    background: transparent;
    position: relative;
    cursor: pointer;
}
.shutter-btn::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 62px;
    height: 62px;
    background: white;
    border-radius: 50%;
    transition: 0.1s;
}
.shutter-btn:active::after {
    width: 55px;
    height: 55px;
    background: var(--accent);
}
</style>
