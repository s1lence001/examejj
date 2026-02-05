import Link from 'next/link';
import { TecnicaComStatus } from '@/types';
import { ProgressBar } from './ProgressBar';

interface TecnicaCardProps {
    tecnica: TecnicaComStatus;
}

const statusConfig = {
    nao_sei: { icon: '🔴', className: 'status-nao-sei' },
    aprendendo: { icon: '🟡', className: 'status-aprendendo' },
    dominada: { icon: '🟢', className: 'status-dominada' },
};

export function TecnicaCard({ tecnica }: TecnicaCardProps) {
    const config = statusConfig[tecnica.status];

    const getQtdLabel = () => {
        if (tecnica.qtdExigida === null) return 'Teórica';
        if (tecnica.qtdExigida === 'TODOS') return `${tecnica.variacoesDominadas}/${tecnica.totalVariacoes || '?'} (Todas)`;
        return `${tecnica.variacoesDominadas}/${tecnica.qtdExigida}`;
    };

    const getProgress = () => {
        if (tecnica.qtdExigida === null) return { value: tecnica.status === 'dominada' ? 1 : 0, max: 1 };
        if (tecnica.qtdExigida === 'TODOS') return { value: tecnica.variacoesDominadas, max: Math.max(tecnica.totalVariacoes, 1) };
        return { value: tecnica.variacoesDominadas, max: tecnica.qtdExigida };
    };

    const progress = getProgress();

    return (
        <Link href={`/tecnica/${tecnica.id}`} className={`tecnica-card ${config.className}`}>
            <div className="tecnica-card-header">
                <span className="status-icon">{config.icon}</span>
                <span className="tecnica-nome">{tecnica.nome}</span>
            </div>

            <div className="tecnica-card-footer">
                <ProgressBar value={progress.value} max={progress.max} size="small" showLabel={false} />
                <span className="tecnica-qtd">{getQtdLabel()}</span>
            </div>
        </Link>
    );
}
