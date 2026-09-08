"use client";

import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { Plus } from "lucide-react";

interface ContactBulkBarProps {
    selectedCount: number;
    onClearSelection: () => void;
    onBulkDelete: () => void;
    allTags: string[];
    onBulkAddTag: (tag: string) => void;
}

export function ContactBulkBar({
    selectedCount,
    onClearSelection,
    onBulkDelete,
    allTags,
    onBulkAddTag,
}: ContactBulkBarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-zinc-800 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-200 z-40 border border-zinc-700/50">
            <span className="text-sm font-medium pl-1">
                {selectedCount} selected
            </span>
            <div className="h-4 w-[1px] bg-zinc-700" />
            <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="hover:bg-zinc-800 text-zinc-300 hover:text-white h-8"
            >
                Cancel
            </Button>
            <Button
                variant="destructive"
                size="sm"
                onClick={onBulkDelete}
                className="h-8 shadow-sm"
            >
                Delete
            </Button>

            {/* Bulk Tagging Popover */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 shadow-sm text-zinc-900 dark:text-zinc-100"
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Add Tag
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="center" side="top">
                    <Command>
                        <CommandInput placeholder="Tag name..." />
                        <CommandList>
                            <CommandEmpty>
                                <div className="p-2 text-center text-xs text-muted-foreground">
                                    Type to create new tag
                                </div>
                            </CommandEmpty>
                            <CommandGroup heading="Existing Tags">
                                {allTags.map((tag) => (
                                    <CommandItem
                                        key={tag}
                                        onSelect={() => onBulkAddTag(tag)}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add &quot;{tag}&quot;
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                            <CommandSeparator />
                            <CommandGroup heading="Create New">
                                <CommandItem onSelect={(val) => onBulkAddTag(val)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Tag
                                </CommandItem>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
