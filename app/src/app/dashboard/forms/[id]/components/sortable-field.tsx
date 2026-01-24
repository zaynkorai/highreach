import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FormField } from "@/types/form";
import { useFormTheme } from "@/stores/form-editor-store";

interface SortableFieldProps {
    field: FormField;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
}

export function SortableField({ field, isSelected, onSelect, onDelete }: SortableFieldProps) {
    const theme = useFormTheme();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: field.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            onClick={() => onSelect(field.id)}
            className={`relative group p-4 -mx-4 rounded-xl border-2 transition-all cursor-pointer ${isDragging ? "shadow-lg bg-zinc-50 dark:bg-zinc-800" : ""}`}
            style={{
                ...style,
                borderColor: isSelected ? theme?.primaryColor : 'transparent',
                backgroundColor: isSelected ? `${theme?.primaryColor}10` : undefined,
            }}
        >
            <div className="flex items-center gap-2 mb-1.5">
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500 p-1 -ml-2 rounded"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                </div>

                <label
                    className="block text-sm font-semibold mb-1"
                    style={{ color: '#000000' }} // Hardcoded black per image style, or theme?.textColor
                >
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
            </div>

            {field.type === 'textarea' ? (
                <textarea
                    disabled
                    placeholder={field.placeholder}
                    className="w-full h-24 bg-white dark:bg-black/20 border border-zinc-200 dark:border-white/10 px-3 py-2 text-sm resize-none"
                    style={{
                        borderRadius: `${theme?.borderRadius || 4}px`,
                        color: theme?.textColor
                    }}
                />
            ) : field.type === 'checkbox' ? (
                /* Checkbox / Consent Mode */
                <div className="flex items-start gap-3">
                    <div
                        className="w-4 h-4 mt-1 border border-zinc-300 dark:border-white/20 rounded flex items-center justify-center shrink-0"
                        style={{ borderRadius: '4px' }}
                    >
                        {/* Empty box to mimic unselected */}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        I Consent to Receive SMS Notifications, Alerts & Occasional Marketing Communication from company. Message frequency varies. Message & data rates may apply. Text HELP to (XXX) XXX-XXXX for assistance. You can reply STOP to unsubscribe at any time.
                    </div>
                </div>
            ) : field.type === 'radio' ? (
                <div className="space-y-2">
                    {field.options?.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-white/20"></div>
                            <span className="text-sm text-zinc-600 dark:text-zinc-300">{opt.label}</span>
                        </div>
                    ))}
                    {(!field.options || field.options.length === 0) && (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-white/20"></div>
                            <span className="text-sm text-zinc-600 dark:text-zinc-300">Option 1</span>
                        </div>
                    )}
                </div>
            ) : field.label === 'Button' ? (
                <button
                    disabled
                    className="w-full py-3 text-white font-medium text-sm transition-colors text-center"
                    style={{
                        backgroundColor: '#22c55e', // Hardcoded green match for "Button"
                        borderRadius: `${theme?.borderRadius || 4}px`
                    }}
                >
                    Button
                </button>
            ) : field.type === 'select' || field.type === 'date' ? (
                <div className="relative">
                    <input
                        disabled
                        type="text"
                        placeholder={field.type === 'date' ? 'mm/dd/yyyy' : 'Select...'}
                        className="w-full h-10 bg-white dark:bg-black/20 border border-zinc-200 dark:border-white/10 px-3 py-2 text-sm"
                        style={{
                            borderRadius: `${theme?.borderRadius || 4}px`,
                            color: theme?.textColor
                        }}
                    />
                    {field.type === 'select' && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[10px]">▼</div>
                    )}
                </div>
            ) : (
                <input
                    disabled
                    type={field.type}
                    placeholder={field.placeholder || field.label} // Logic from image: placeholders match label often
                    className="w-full h-10 bg-white dark:bg-black/20 border border-zinc-200 dark:border-white/10 px-3 py-2 text-sm"
                    style={{
                        borderRadius: `${theme?.borderRadius || 4}px`,
                        color: theme?.textColor
                    }}
                />
            )}

            {/* Quick Actions */}
            <div
                className={`absolute top-2 right-2 flex gap-1 ${isSelected || isDragging ? 'opacity-100' : 'opacity-0'
                    } group-hover:opacity-100 transition-opacity`}
            >
                <button
                    onClick={(e) => onDelete(field.id, e)}
                    className="p-1.5 bg-white dark:bg-zinc-800 text-red-500 rounded shadow-sm hover:bg-red-50 border border-zinc-200 dark:border-white/10"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
