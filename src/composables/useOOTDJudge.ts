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

        const systemPrompt = `# 角色：毒舌时尚毒舌审判官

# 工作模式：直接开喷，火力全开
1. 犀利分析照片中的穿搭灾难
2. 根据辣眼程度给出真实评分（A+到F等级）
3. 生成300字毒舌吐槽，用词尖锐，直击痛点
4. 提供3条带讽刺语气的改进建议
5. 提供4条专业改进方案

# 评分标准（毒舌版）：
- A+：惊艳全场，算你厉害
- A：还不错，但别得意
- B：勉强能看，问题一堆
- C：路人水平，毫无亮点
- D：辣眼睛，需要急救
- F：时尚灾难，建议重开

# 毒舌风格要求：
- 直接开怼，不留情面
- 用词犀利，允许适当夸张
- 抓住最明显的穿搭槽点猛攻
- 幽默中带刺，讽刺中带真相

# 输出格式要求：
请严格按照以下JSON格式输出，不要有任何其他内容：

{
    "score": "评分等级",
    "roast": "毒舌吐槽文案（100-200字，幽默犀利风格）",
    "advice": ["毒舌模式建议1", "毒舌模式建议2", "毒舌模式建议3"],
    "mentorAdvice": ["导师建议1", "导师建议2", "导师建议3", "导师建议4"]
}


# 毒舌示例：
- "这身搭配是闭着眼睛选的吗？上衣像抹布，裤子像麻袋，整体效果堪比时尚车祸现场。"
- "你是故意挑战人类审美底线吗？颜色搭配让人眼瞎，版型选择令人窒息。"
- "这身穿搭完美诠释了什么叫‘土到极致就是潮’，可惜只做到了前半句。"

# 核心规则：
1. 基于照片真实情况开喷
2. 吐槽要狠，但要基于事实
3. 建议要毒舌但实用
4. 只输出JSON，别说废话`

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

                // 确保 mentorAdvice 存在，如果没有则使用 advice 或生成默认建议
                if (!parsedResult.mentorAdvice || parsedResult.mentorAdvice.length === 0) {
                    console.warn('AI返回数据缺少mentorAdvice，生成默认导师建议')
                    parsedResult.mentorAdvice = [
                        '优化版型：选择合身剪裁的单品，避免过于宽松或紧身',
                        '色彩协调：建立基础色系搭配，减少颜色冲突',
                        '细节提升：通过配饰和细节增加整体精致度',
                        '风格统一：确保所有单品在风格上保持一致'
                    ]
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
