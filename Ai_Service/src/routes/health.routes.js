import express from 'express';

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ai-microservice',
    uptime: Number(process.uptime().toFixed(2)),
  });
});

export default router;
