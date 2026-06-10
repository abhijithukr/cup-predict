import { prisma } from '../lib/prisma';

export async function scoreFixture(predictionId: string, actualScoreA: number, actualScoreB: number) {
  const pred = await prisma.prediction.findUnique({
    where: { id: predictionId },
  });
  if (!pred || pred.status !== 'OPEN') return;

  const correct = pred.scoreA === actualScoreA && pred.scoreB === actualScoreB;
  const pointsEarned = correct ? 15 : 0;

  await prisma.prediction.update({
    where: { id: predictionId },
    data: {
      status: correct ? 'CORRECT' : 'INCORRECT',
      pointsEarned,
    },
  });

  if (correct) {
    await prisma.user.update({
      where: { id: pred.userId },
      data: { points: { increment: pointsEarned }, winStreak: { increment: 1 } },
    });
  } else {
    await prisma.user.update({
      where: { id: pred.userId },
      data: { winStreak: 0 },
    });
  }
}
