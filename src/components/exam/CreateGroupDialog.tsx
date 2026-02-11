'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (name: string) => void;
    defaultName?: string;
    title?: string;
    description?: string;
}

export function CreateGroupDialog({
    open,
    onOpenChange,
    onConfirm,
    defaultName = '',
    title = 'Agrupar Requisitos',
    description = 'Dê um nome para este grupo de técnicas.'
}: CreateGroupDialogProps) {
    const [name, setName] = useState(defaultName);

    useEffect(() => {
        if (open) {
            setName(defaultName);
        }
    }, [open, defaultName]);

    const handleConfirm = () => {
        if (name.trim()) {
            onConfirm(name.trim());
            onOpenChange(false);
            setName('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Nome
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleConfirm();
                                }
                            }}
                            className="col-span-3"
                            autoFocus
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirm} disabled={!name.trim()}>
                        Salvar Grupo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
