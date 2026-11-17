import { aiClientService } from '../service/aiClientService.js';

export async function chat(req, res) {
  try {
    const { message, history, studentProfile } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const data = await aiClientService.chat({
      message: message.trim(),
      history: Array.isArray(history) ? history : [],
      studentProfile,
    });

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('AI chat failed:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to process AI chat',
    });
  }
}

export async function recommendMajor(req, res) {
  try {
    const { interests, strengths, favoriteSubjects, careerGoals } = req.body;

    if (!interests && !strengths && !favoriteSubjects && !careerGoals) {
      return res.status(400).json({
        success: false,
        message: 'Please provide interests, strengths, favorite subjects, or career goals',
      });
    }

    const data = await aiClientService.recommendMajor({
      interests,
      strengths,
      favoriteSubjects,
      careerGoals,
    });

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Major recommendation failed:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to generate recommendations',
    });
  }
}

export async function generate(req, res) {
  try {
    const { prompt, systemInstruction, temperature } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required',
      });
    }

    const data = await aiClientService.generateWithPrompt({
      prompt: prompt.trim(),
      systemInstruction,
      temperature,
    });

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('AI generate failed:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Generation failed',
    });
  }
}

export async function health(req, res) {
  const healthData = await aiClientService.healthCheck();
  return res.status(200).json({
    success: true,
    status: 'ok',
    data: healthData,
  });
}

export const aiController = {
  chat,
  recommendMajor,
  generate,
  health,
  // Backwards compatibility aliases if needed
  handleChat: chat,
  handleRecommendMajor: recommendMajor,
  handleGenerate: generate,
  handleHealth: health,
};
