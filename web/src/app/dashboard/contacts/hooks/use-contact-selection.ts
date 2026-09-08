"use client";

import { useState, useCallback } from "react";

export function useContactSelection() {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const handleSelectAll = useCallback((checked: boolean, allIds: string[]) => {
        if (checked) {
            setSelectedIds(new Set(allIds));
        } else {
            setSelectedIds(new Set());
        }
    }, []);

    const handleSelectOne = useCallback((id: string, checked: boolean) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (checked) {
                next.add(id);
            } else {
                next.delete(id);
            }
            return next;
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const isSelected = useCallback(
        (id: string) => selectedIds.has(id),
        [selectedIds]
    );

    const isAllSelected = useCallback(
        (allIds: string[]) => allIds.length > 0 && allIds.every((id) => selectedIds.has(id)),
        [selectedIds]
    );

    const isSomeSelected = useCallback(
        (allIds: string[]) =>
            selectedIds.size > 0 && !allIds.every((id) => selectedIds.has(id)),
        [selectedIds]
    );

    return {
        selectedIds,
        handleSelectAll,
        handleSelectOne,
        clearSelection,
        isSelected,
        isAllSelected,
        isSomeSelected,
        selectedCount: selectedIds.size,
    };
}
