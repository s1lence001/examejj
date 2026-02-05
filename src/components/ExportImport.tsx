'use client';

import { useRef } from 'react';

interface ExportImportProps {
    onExport: () => void;
    onImport: (json: string) => boolean;
}

export function ExportImport({ onExport, onImport }: ExportImportProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const json = event.target?.result as string;
            const success = onImport(json);
            if (success) {
                alert('Dados importados com sucesso!');
            } else {
                alert('Erro ao importar dados. Verifique o arquivo.');
            }
        };
        reader.readAsText(file);

        // Reset input
        e.target.value = '';
    };

    return (
        <div className="export-import">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                style={{ display: 'none' }}
            />
            <button className="btn-secondary btn-small" onClick={handleImportClick}>
                📥 Importar
            </button>
            <button className="btn-secondary btn-small" onClick={onExport}>
                📤 Exportar
            </button>
        </div>
    );
}
