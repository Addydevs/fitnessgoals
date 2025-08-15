import vision from '@google-cloud/vision';
import { Request, Response } from 'express';
import { generateGeminiContent } from '../utils/geminiApi';

const client = new vision.ImageAnnotatorClient({
  credentials: process.env.VISION_SERVICE_ACCOUNT_BASE64
    ? JSON.parse(Buffer.from(process.env.VISION_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'))
    : undefined,
});

export const analyzeProgress = async (req: Request, res: Response) => {
  const { previousPhoto, currentPhoto, goal, text } = req.body;
  // If text-only request (no photos), use Gemini AI
  if ((!previousPhoto || previousPhoto.length < 100) && (!currentPhoto || currentPhoto.length < 100)) {
    if (typeof text === 'string' && text.trim().length > 0) {
      try {
        const feedback = await generateGeminiContent(text);
        if (!feedback) {
          return res.status(500).json({ error: 'Gemini AI did not return a response.' });
        }
        return res.json({ feedback });
      } catch {
        return res.status(500).json({ error: 'Error connecting to Gemini AI.' });
      }
    } else {
      return res.status(400).json({ error: 'No valid photo or text question provided.' });
    }
  }
  // If photos are provided, run Vision AI analysis as before
  try {
    if (typeof previousPhoto !== 'string' || typeof currentPhoto !== 'string' || previousPhoto.length < 100 || currentPhoto.length < 100) {
      return res.status(400).json({ error: 'Photos must be valid base64-encoded strings.' });
    }
    const [prevResult] = await client.labelDetection({ image: { content: previousPhoto } });
    const [currResult] = await client.labelDetection({ image: { content: currentPhoto } });
    if (!prevResult.labelAnnotations || !currResult.labelAnnotations) {
      return res.status(422).json({ error: 'Vision AI did not return any labels. Please try different photos.' });
    }
    const prevLabels = prevResult.labelAnnotations.map(l => l.description).join(', ') || 'No labels';
    const currLabels = currResult.labelAnnotations.map(l => l.description).join(', ') || 'No labels';
    const feedback = `Previous photo labels: ${prevLabels}.\nCurrent photo labels: ${currLabels}.\nGoal: ${goal || 'General fitness'}.`;
    return res.json({ feedback });
  } catch (error: any) {
    console.error('Vision AI error:', error?.message || error);
    return res.status(500).json({ error: `Error connecting to Vision AI: ${error?.message || error}` });
  }
};
