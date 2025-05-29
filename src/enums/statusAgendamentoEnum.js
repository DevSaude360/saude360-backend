const StatusAgendamentoEnum = Object.freeze({
    SOLICITADA: 1,
    AGENDADA: 2,
    RECUSADA_PELO_PROFISSIONAL: 3,
    REAGENDAMENTO_SUGERIDO_PELO_PROFISSIONAL: 4,
    NOVA_PROPOSTA_PACIENTE_AGUARDANDO_PROFISSIONAL: 5,
    REAGENDAMENTO_RECUSADO_PELO_PACIENTE: 6,
    CANCELADA_PELO_PACIENTE: 7,
    CANCELADA_PELO_PROFISSIONAL: 8,
    CONCLUIDA: 9,
});

const StatusAgendamentoDescricao = Object.freeze({
    [StatusAgendamentoEnum.SOLICITADA]: "Solicitada",
    [StatusAgendamentoEnum.AGENDADA]: "Agendada",
    [StatusAgendamentoEnum.RECUSADA_PELO_PROFISSIONAL]: "Recusada pelo Profissional",
    [StatusAgendamentoEnum.REAGENDAMENTO_SUGERIDO_PELO_PROFISSIONAL]: "Reagendamento Sugerido pelo Profissional",
    [StatusAgendamentoEnum.NOVA_PROPOSTA_PACIENTE_AGUARDANDO_PROFISSIONAL]: "Nova Proposta Paciente Aguardando Profissional",
    [StatusAgendamentoEnum.REAGENDAMENTO_RECUSADO_PELO_PACIENTE]: "Reagendamento Recusado pelo Paciente",
    [StatusAgendamentoEnum.CANCELADA_PELO_PACIENTE]: "Cancelada pelo Paciente",
    [StatusAgendamentoEnum.CANCELADA_PELO_PROFISSIONAL]: "Cancelada pelo Profissional",
    [StatusAgendamentoEnum.CONCLUIDA]: "Concluída",
});

module.exports = {
    StatusAgendamentoEnum,
    StatusAgendamentoDescricao,
};