import { env } from '../../lib/env.js';
import { AppError } from '../../lib/errors.js';
import { getRecentClientOrders } from './whatsapp.repository.js';
export class WhatsAppAiService {
    async generateSuggestion(settings, context) {
        if (!settings.aiEnabled) {
            throw new AppError('O modo IA esta desativado para este tenant.', 409);
        }
        const apiKey = settings.openAiApiKey || env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new AppError('A chave da IA nao foi configurada.', 409);
        }
        const recentOrders = await getRecentClientOrders(context.tenantId, context.customerName, context.phone);
        const conversationText = context.messages
            .slice(-10)
            .map((item) => `${item.direction === 'INBOUND' ? 'Cliente' : 'Atendente'}: ${item.body}`)
            .join('\n');
        const orderHints = recentOrders
            .map((item) => {
            const payload = typeof item.payload === 'object' && item.payload ? JSON.stringify(item.payload) : String(item.payload || '');
            return payload.slice(0, 400);
        })
            .join('\n---\n');
        const systemPrompt = [
            'Voce e um atendente comercial do sistema Nexus de Pedidos.',
            'Responda de forma educada, objetiva, natural e curta.',
            'Use apenas as informacoes disponiveis.',
            'Nao invente preco, estoque, status ou prazo.',
            'Se faltar informacao, peca esclarecimento de forma humana.',
            'Retorne apenas a mensagem final que sera enviada ao cliente, sem explicacoes extras.'
        ].join(' ');
        const userPrompt = [
            context.customerName ? `Cliente: ${context.customerName}` : null,
            `Telefone: ${context.phone}`,
            'Historico recente da conversa:',
            conversationText || 'Sem historico disponivel.',
            orderHints ? `Dados recentes de pedidos sincronizados:\n${orderHints}` : null,
            'Gere uma sugestao de resposta para a ultima mensagem recebida.'
        ]
            .filter(Boolean)
            .join('\n\n');
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: env.OPENAI_MODEL,
                temperature: 0.4,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ]
            })
        });
        const payload = (await response.json().catch(() => ({})));
        if (!response.ok) {
            throw new AppError(payload.error?.message || 'Falha ao gerar sugestao com IA.', response.status);
        }
        const content = payload.choices?.[0]?.message?.content?.trim();
        if (!content) {
            throw new AppError('A IA nao retornou uma sugestao valida.', 502);
        }
        return content;
    }
}
