import { prisma } from '../lib/prisma';

async function recordPointEvent(userId: string, earned: number, reason: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { points: true } });
  if (!user) return;
  await prisma.pointEvent.create({
    data: { userId, points: user.points + earned, earned, reason },
  });
}

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
    await recordPointEvent(pred.userId, pointsEarned, 'match_correct');
  } else {
    await prisma.user.update({
      where: { id: pred.userId },
      data: { winStreak: 0 },
    });
  }
}
