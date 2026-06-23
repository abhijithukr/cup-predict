import { prisma } from '../lib/prisma';

export async function scoreFixture(predictionId: string, actualScoreA: number, actualScoreB: number): Promise<boolean> {
  const pred = await prisma.prediction.findUnique({
    where: { id: predictionId },
  });
  if (!pred) return false;

  const correct = pred.scoreA === actualScoreA && pred.scoreB === actualScoreB;
  const shouldBeStatus: 'CORRECT' | 'INCORRECT' = correct ? 'CORRECT' : 'INCORRECT';

  const newPoints = correct ? 15 : 0;
  const oldPoints = pred.pointsEarned || 0;
  const pointsDiff = newPoints - oldPoints;

  if (pointsDiff === 0 && pred.status === shouldBeStatus) return false;

  await prisma.$transaction(async (tx: any) => {
    await tx.prediction.update({
      where: { id: predictionId },
      data: { status: shouldBeStatus, pointsEarned: newPoints },
    });

    if (pointsDiff !== 0) {
      await tx.user.update({
        where: { id: pred.userId },
        data: { points: { increment: pointsDiff } },
      });
    }

    if (correct) {
      if (pred.status !== 'CORRECT') {
        await tx.user.update({
          where: { id: pred.userId },
          data: { winStreak: { increment: 1 } },
        });
      }
      const user = await tx.user.findUnique({ where: { id: pred.userId }, select: { points: true } });
      await tx.pointEvent.create({
        data: { userId: pred.userId, points: user?.points ?? 0, earned: newPoints, reason: 'match_correct' },
      });
    } else {
      if (pred.status !== 'INCORRECT') {
        await tx.user.update({
          where: { id: pred.userId },
          data: { winStreak: 0 },
        });
      }
      if (pointsDiff < 0) {
        const user = await tx.user.findUnique({ where: { id: pred.userId }, select: { points: true } });
        await tx.pointEvent.create({
          data: { userId: pred.userId, points: user?.points ?? 0, earned: newPoints, reason: 'scoring_correction' },
        });
      }
    }
  });

  return true;
}
