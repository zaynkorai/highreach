"use client";

import { useFormEditorActions, useFormFields, useSelectedField } from "@/stores/form-editor-store";
import { LogicOperator, LogicRule } from "@/types/form";
import { useState } from "react";

export function LogicEditor() {
    const field = useSelectedField();
    const fields = useFormFields();
    const { updateField } = useFormEditorActions();

    if (!field) return null;

    // Filter out current field to avoid self-reference loops (basic prevention)
    const availableFields = fields.filter(f => f.id !== field.id);

    const addRule = () => {
        const newRule: LogicRule = {
            id: crypto.randomUUID(),
            action: 'show',
            conditions: [{
                fieldId: availableFields[0]?.id || '', // Default to first available
                operator: 'equals',
                value: ''
            }]
        };
        updateField(field.id, { logic: [...(field.logic || []), newRule] });
    };

    const removeRule = (ruleIndex: number) => {
        if (!field.logic) return;
        const newLogic = field.logic.filter((_, i) => i !== ruleIndex);
        updateField(field.id, { logic: newLogic });
    };

    const updateRuleAction = (ruleIndex: number, action: 'show' | 'hide') => {
        if (!field.logic) return;
        const newLogic = [...field.logic];
        newLogic[ruleIndex] = { ...newLogic[ruleIndex], action };
        updateField(field.id, { logic: newLogic });
    };

    const updateCondition = (ruleIndex: number, conditionIndex: number, updates: any) => {
        if (!field.logic) return;
        const newLogic = [...field.logic];
        const newConditions = [...newLogic[ruleIndex].conditions];
        newConditions[conditionIndex] = { ...newConditions[conditionIndex], ...updates };
        newLogic[ruleIndex] = { ...newLogic[ruleIndex], conditions: newConditions };
        updateField(field.id, { logic: newLogic });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Conditional Logic</h3>
                <button
                    onClick={addRule}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                    + Add Rule
                </button>
            </div>

            {(!field.logic || field.logic.length === 0) && (
                <p className="text-xs text-zinc-500 italic p-3 bg-zinc-50 dark:bg-white/5 rounded-lg border border-dashed border-zinc-200 dark:border-white/10 text-center">
                    No logic rules set for this field.
                    <br />
                    It is always visible by default.
                </p>
            )}

            <div className="space-y-3">
                {field.logic?.map((rule, rIndex) => (
                    <div key={rule.id} className="p-3 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                                <select
                                    value={rule.action}
                                    onChange={(e) => updateRuleAction(rIndex, e.target.value as 'show' | 'hide')}
                                    className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
                                >
                                    <option value="show">Show</option>
                                    <option value="hide">Hide</option>
                                </select>
                                <span className="text-zinc-500">this field if:</span>
                            </div>
                            <button
                                onClick={() => removeRule(rIndex)}
                                className="text-zinc-400 hover:text-red-500"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {rule.conditions.map((condition, cIndex) => (
                            <div key={cIndex} className="space-y-2">
                                <select
                                    value={condition.fieldId}
                                    onChange={(e) => updateCondition(rIndex, cIndex, { fieldId: e.target.value })}
                                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                                >
                                    <option value="" disabled>Select a field</option>
                                    {availableFields.map(f => (
                                        <option key={f.id} value={f.id}>{f.label}</option>
                                    ))}
                                </select>

                                <div className="flex gap-2">
                                    <select
                                        value={condition.operator}
                                        onChange={(e) => updateCondition(rIndex, cIndex, { operator: e.target.value as LogicOperator })}
                                        className="w-1/3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                                    >
                                        <option value="equals">is equal to</option>
                                        <option value="not_equals">is not equal to</option>
                                        <option value="contains">contains</option>
                                        <option value="greater_than">greater than</option>
                                        <option value="less_than">less than</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={condition.value}
                                        onChange={(e) => updateCondition(rIndex, cIndex, { value: e.target.value })}
                                        placeholder="Value..."
                                        className="flex-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
