import { ref } from 'vue'

export interface AdviceData {
    score: string
    roast: string
    advice: string[]
    mentorAdvice?: string[] // 导师模式的详细建议
}

export function useOOTDJudge() {
    const isLoading = ref(false)

    // 备用数据（当API调用失败时使用）
    const fallbackData: AdviceData[] = [
        {
            score: 'C-',
            roast: '这身穿搭展现了一种令人困惑的自信。上衣的颜色和你的肤色在打架，而裤子松垮得像是在向地心引力投降。整体看起来就像是一个还没睡醒的大学生匆忙赶早八。',
            advice: [
                '提升精神气：把上衣塞进去，或者换一件修身一点的版型。',
                '色彩管理：全身上下颜色有点杂，试着把鞋子换成和上衣呼应的颜色。',
                '细节加分：戴个帽子或者整理一下发型，让整体看起来是‘刻意慵懒’而不是‘真邋遢》。'
            ],
            mentorAdvice: [
                '版型调整：选择合身但不紧身的款式，避免过于宽松显得邋遢',
                '色彩搭配：建立基础色+点缀色的搭配原则，减少颜色冲突',
                '配饰运用：通过帽子、手表等小物件提升整体精致度',
                '面料选择：考虑季节和场合选择合适的面料材质'
            ]
        },
        {
            score: 'F',
            roast: '视觉污染级别。这件外套是在和里面的卫衣比丑吗？你成功的避开了所有时尚的可能性，创造了一种全新的‘路人甲’风格。',
            advice: ['立刻脱掉：这件外套不适合你，换成纯黑色的夹克。', '制造层次：内搭太长了，把它卷起来露出一点腰线。', '鞋子也是败笔：换一双干净的小白鞋或者马丁靴。'],
            mentorAdvice: [
                '单品替换：用经典款夹克替代现有外套，提升质感',
                '层次构建：学习内长外短的搭配技巧，制造视觉层次',
                '鞋履选择：根据整体风格选择匹配的鞋款，避免风格冲突',
                '比例调整：注意上下身比例，通过塞衣角等方式优化身形'
            ]
        },
        {
            score: 'D',
            roast: '典型的‘用力过猛》。身上的 Logo 太多了，你是想当行走的广告牌吗？这种混搭风格很大胆，但并不是好的那种大胆。',
            advice: ['做减法：全身上下只保留一个重点 Logo，其他的换成素色。', '统一色调：裤子颜色太跳跃，换成深灰或牛仔蓝。', '自信一点：你的姿态比衣服更僵硬，放松肩膀。'],
            mentorAdvice: [
                '品牌克制：选择1-2个有设计感的单品，避免过度展示Logo',
                '色彩统一：建立以中性色为基础的配色方案',
                '风格协调：确保所有单品在风格上保持一致',
                '自信培养：穿搭最终服务于个人气质，保持自然姿态'
            ]
        }
    ]

    const callZhipuAI = async (base64Data: string): Promise<AdviceData> => {
        const apiKey = import.meta.env.VITE_AI_API_KEY

        if (!apiKey || apiKey === 'your_zhipu_api_key_here') {
            console.warn('API_KEY 未设置，将使用备用数据')
            const randomIndex = Math.floor(Math.random() * fallbackData.length)
            return fallbackData[randomIndex]
        }

        const systemPrompt = `# 角色：毒舌时尚穿搭审判官 + 专业时尚导师，拥有双重身份

# 工作流程：
1. 细致分析照片中的穿搭元素：服装款式、颜色搭配、配饰选择、整体协调性
2. 根据穿搭质量给出评分（A+到F等级）
3. 生成毒舌风格的吐槽文案，要幽默犀利但不过分伤人
4. 提供3条简洁的改进建议（毒舌模式）
5. 提供4条详细的导师建议（导师模式）

# 评分标准：
- A+：完美搭配，无可挑剔
- A：优秀搭配，细节到位
- B：良好搭配，略有不足
- C：普通搭配，需要改进
- D：较差搭配，问题明显
- F：灾难级别，需要重来

# 输出格式要求：
请严格按照以下JSON格式输出，不要有任何其他内容：

{
    "score": "评分等级",
    "roast": "毒舌吐槽文案（100-200字，幽默犀利风格）",
    "advice": ["毒舌模式建议1", "毒舌模式建议2", "毒舌模式建议3"],
    "mentorAdvice": ["导师建议1", "导师建议2", "导师建议3", "导师建议4"]
}

# 毒舌风格示例：
- "这身穿搭展现了一种令人困惑的自信。上衣的颜色和你的肤色在打架，而裤子松垮得像是在向地心引力投降。"
- "视觉污染级别。这件外套是在和里面的卫衣比丑吗？你成功的避开了所有时尚的可能性。"
- "典型的‘用力过猛》。身上的 Logo 太多了，你是想当行走的广告牌吗？"

# 导师建议特点：
- 更专业、更详细的改进方案
- 包含具体的搭配技巧和原则
- 提供多个角度的优化建议
- 语气温和专业，不像毒舌模式那样犀利

# 核心规则：
1. 严格贴合照片中的穿搭内容，不脱离画面凭空创作
2. 评分要客观公正，基于穿搭的实际表现
3. 建议要具体可行，针对照片中的问题
4. 仅输出JSON格式，无其他多余内容`

        const userPrompt = '请分析这张照片中的穿搭，给出毒舌评价和改进建议。'

        try {
            isLoading.value = true

            const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'GLM-4.1V-Thinking-Flash',
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `data:image/jpeg;base64,${base64Data}`
                                    }
                                },
                                {
                                    type: 'text',
                                    text: userPrompt
                                }
                            ]
                        }
                    ]
                })
            })

            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`)
            }

            const data = await response.json()
            const result = data.choices[0]?.message?.content || '{}'

            // 解析JSON结果
            try {
                console.log('AI返回的原始内容:', result)
                const parsedResult = JSON.parse(result) as AdviceData

                // 验证必要字段是否存在
                if (!parsedResult.score || !parsedResult.roast || !parsedResult.advice) {
                    console.warn('AI返回数据缺少必要字段，使用备用数据')
                    const randomIndex = Math.floor(Math.random() * fallbackData.length)
                    return fallbackData[randomIndex]
                }

                // 确保 mentorAdvice 存在，如果没有则使用 advice
                if (!parsedResult.mentorAdvice) {
                    console.warn('AI返回数据缺少mentorAdvice，使用advice作为替代')
                    parsedResult.mentorAdvice = parsedResult.advice
                }

                console.log('解析后的AI数据:', parsedResult)
                isLoading.value = false
                return parsedResult
            } catch (parseError) {
                console.error('JSON解析失败:', parseError)
                console.error('解析失败的内容:', result)
                // 如果解析失败，使用备用数据
                const randomIndex = Math.floor(Math.random() * fallbackData.length)
                return fallbackData[randomIndex]
            }
        } catch (error) {
            console.error('API调用失败:', error)
            isLoading.value = false

            // 返回备用数据
            const randomIndex = Math.floor(Math.random() * fallbackData.length)
            return fallbackData[randomIndex]
        }
    }

    // 从base64图片数据中提取纯base64字符串
    const extractBase64FromDataUrl = (dataUrl: string): string => {
        const base64Index = dataUrl.indexOf(',')
        return base64Index !== -1 ? dataUrl.substring(base64Index + 1) : dataUrl
    }

    const getAIJudgment = async (imageDataUrl: string): Promise<AdviceData> => {
        const base64Data = extractBase64FromDataUrl(imageDataUrl)
        return await callZhipuAI(base64Data)
    }

    return {
        getAIJudgment,
        isLoading
    }
}
