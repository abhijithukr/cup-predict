import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const teams = [
  { code: 'GER', name: 'Germany', flagUrl: '/flags/de.png', groupName: 'Group A' },
  { code: 'DEN', name: 'Denmark', flagUrl: '/flags/dk.png', groupName: 'Group A' },
  { code: 'ESP', name: 'Spain', flagUrl: '/flags/es.png', groupName: 'Group A' },
  { code: 'GEO', name: 'Georgia', flagUrl: '/flags/ge.png', groupName: 'Group A' },
  { code: 'POR', name: 'Portugal', flagUrl: '/flags/pt.png', groupName: 'Group B' },
  { code: 'SVN', name: 'Slovenia', flagUrl: '/flags/si.png', groupName: 'Group B' },
  { code: 'FRA', name: 'France', flagUrl: '/flags/fr.png', groupName: 'Group B' },
  { code: 'BEL', name: 'Belgium', flagUrl: '/flags/be.png', groupName: 'Group B' },
];

const fixtures = [
  { groupName: 'Group A', teamACode: 'GER', teamBCode: 'DEN', kickoffTime: new Date('2026-06-14T20:00:00Z') },
  { groupName: 'Group A', teamACode: 'ESP', teamBCode: 'GEO', kickoffTime: new Date('2026-06-15T18:00:00Z') },
  { groupName: 'Group B', teamACode: 'POR', teamBCode: 'SVN', kickoffTime: new Date('2026-06-15T20:00:00Z') },
  { groupName: 'Group B', teamACode: 'FRA', teamBCode: 'BEL', kickoffTime: new Date('2026-06-16T18:00:00Z') },
];

async function seed() {
  console.log('Seeding database...');

  for (const team of teams) {
    await prisma.team.upsert({
      where: { code: team.code },
      update: team,
      create: team,
    });
  }

  for (const fixture of fixtures) {
    await prisma.fixture.create({ data: fixture });
  }

  console.log('Seed complete!');
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
