import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient, PlanInterval, PlanStatus } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'default' },
        update: {},
        create: {
            name: 'Nexus Comercial',
            slug: 'default'
        }
    });
    const adminEmail = process.env.ADMIN_SEED_EMAIL?.trim() || 'lucaspelissar@hotmail.com';
    const adminPassword = process.env.ADMIN_SEED_PASSWORD?.trim() || 'Ctrl@1004';
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.adminUser.upsert({
        where: { email: adminEmail },
        update: {
            name: 'Administrador Nexus',
            passwordHash,
            role: 'ADMIN',
            isActive: true,
            tenantId: tenant.id
        },
        create: {
            tenantId: tenant.id,
            name: 'Administrador Nexus',
            email: adminEmail,
            passwordHash,
            role: 'ADMIN',
            isActive: true
        }
    });
    const basePlans = [
        {
            name: 'Mensal',
            interval: PlanInterval.MENSAL,
            price: '149.90',
            description: 'Plano mensal com suporte ao emissor e atualizacoes do canal estavel.',
            deviceLimit: 1,
            features: ['Emissor fiscal', 'Licenca mensal', 'Atualizacoes stable'],
            enabledEditions: ['EMPRESARIAL']
        },
        {
            name: 'Anual',
            interval: PlanInterval.ANUAL,
            price: '1499.90',
            description: 'Plano anual com prioridade comercial e atualizacoes liberadas.',
            deviceLimit: 2,
            features: ['Emissor fiscal', 'Licenca anual', 'Atualizacoes stable', 'Prioridade em suporte'],
            enabledEditions: ['EMPRESARIAL']
        }
    ];
    for (const plan of basePlans) {
        await prisma.plan.upsert({
            where: {
                tenantId_name: {
                    tenantId: tenant.id,
                    name: plan.name
                }
            },
            update: {
                interval: plan.interval,
                price: plan.price,
                description: plan.description,
                deviceLimit: plan.deviceLimit,
                features: plan.features,
                enabledEditions: plan.enabledEditions,
                status: PlanStatus.ATIVO
            },
            create: {
                tenantId: tenant.id,
                name: plan.name,
                interval: plan.interval,
                price: plan.price,
                description: plan.description,
                deviceLimit: plan.deviceLimit,
                features: plan.features,
                enabledEditions: plan.enabledEditions,
                status: PlanStatus.ATIVO
            }
        });
    }
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (error) => {
    console.error('[seed] Falha ao executar seed:', error);
    await prisma.$disconnect();
    process.exit(1);
});
