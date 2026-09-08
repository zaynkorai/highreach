"use client";

import { ContactView } from "@/types/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Check, Filter, Plus, Search, X as XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactToolbarProps {
    savedViews: ContactView[];
    activeViewId: string | null;
    onSwitchView: (view: ContactView | null) => void;
    onDeleteView: (id: string, e: React.MouseEvent) => void;
    onSaveView: () => void;
    onImportClick: () => void;
    onAddContactClick: () => void;
    searchQuery: string;
    onSearchChange: (value: string) => void;
    filterSource: string;
    allSources: string[];
    onSourceChange: (source: string) => void;
    filterTags: string[];
    allTags: string[];
    onTagToggle: (tag: string) => void;
    onClearTags: () => void;
    hasActiveFilters: boolean;
    onResetFilters: () => void;
}

export function ContactToolbar({
    savedViews,
    activeViewId,
    onSwitchView,
    onDeleteView,
    onSaveView,
    onImportClick,
    onAddContactClick,
    searchQuery,
    onSearchChange,
    filterSource,
    allSources,
    onSourceChange,
    filterTags,
    allTags,
    onTagToggle,
    onClearTags,
    hasActiveFilters,
    onResetFilters,
}: ContactToolbarProps) {
    return (
        <div className="space-y-4">
            {/* Header & View Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Contacts</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
                        Manage your leads and customers.
                    </p>
                </div>

                {/* Saved Views Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2 sm:mb-0 sm:pb-0 sm:ml-4 flex-1 no-scrollbar mask-linear-fade">
                    <Button
                        variant={activeViewId === null ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => onSwitchView(null)}
                        className={cn(
                            "rounded-full h-8 text-xs font-medium transition-all",
                            activeViewId === null && "bg-zinc-100 dark:bg-zinc-800"
                        )}
                    >
                        All Contacts
                    </Button>
                    {savedViews.map((view) => (
                        <div key={view.id} className="relative group flex-shrink-0">
                            <Button
                                variant={activeViewId === view.id ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => onSwitchView(view)}
                                className={cn(
                                    "rounded-full h-8 text-xs font-medium pr-7 transition-all",
                                    activeViewId === view.id && "bg-zinc-100 dark:bg-zinc-800"
                                )}
                            >
                                {view.name}
                            </Button>
                            <div
                                onClick={(e) => onDeleteView(view.id, e)}
                                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
                            >
                                <XIcon className="h-3 w-3 text-zinc-500" />
                            </div>
                        </div>
                    ))}
                    {hasActiveFilters && activeViewId === null && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onSaveView}
                            className="rounded-full h-8 text-xs border-dashed gap-1 ml-2 text-zinc-500 hover:text-zinc-900 flex-shrink-0"
                        >
                            <Plus className="h-3 w-3" />
                            Save View
                        </Button>
                    )}
                </div>

                {/* Primary Actions */}
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onImportClick}>
                        Import CSV
                    </Button>
                    <Button
                        onClick={onAddContactClick}
                        className="bg-brand-600 hover:bg-brand-700 text-white"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add Contact
                    </Button>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 p-1">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search contacts..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 bg-white dark:bg-zinc-900"
                    />
                </div>

                {/* Source Filter */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="border-dashed">
                            <Filter className="mr-2 h-4 w-4" />
                            Source
                            {filterSource !== "all" && (
                                <>
                                    <span className="mx-2 h-4 w-[1px] shrink-0 bg-border" />
                                    <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                                        {filterSource}
                                    </Badge>
                                </>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Filter source..." />
                            <CommandList>
                                <CommandEmpty>No results found.</CommandEmpty>
                                <CommandGroup>
                                    <CommandItem onSelect={() => onSourceChange("all")}>
                                        <div
                                            className={cn(
                                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                filterSource === "all"
                                                    ? "bg-primary text-primary-foreground"
                                                    : "opacity-50 [&_svg]:invisible"
                                            )}
                                        >
                                            <Check className="h-4 w-4" />
                                        </div>
                                        <span>All Sources</span>
                                    </CommandItem>
                                    {allSources.map((source) => (
                                        <CommandItem
                                            key={source}
                                            onSelect={() => onSourceChange(filterSource === source ? "all" : source)}
                                        >
                                            <div
                                                className={cn(
                                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                    filterSource === source
                                                        ? "bg-primary text-primary-foreground"
                                                        : "opacity-50 [&_svg]:invisible"
                                                )}
                                            >
                                                <Check className="h-4 w-4" />
                                            </div>
                                            <span>{source}</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                {/* Tags Filter */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="border-dashed">
                            <Plus className="mr-2 h-4 w-4" />
                            Tags
                            {filterTags.length > 0 && (
                                <>
                                    <span className="mx-2 h-4 w-[1px] shrink-0 bg-border" />
                                    <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                                        {filterTags.length}
                                    </Badge>
                                    <div className="hidden space-x-1 lg:flex">
                                        {filterTags.length > 2 ? (
                                            <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                                                {filterTags.length} selected
                                            </Badge>
                                        ) : (
                                            filterTags.map((tag) => (
                                                <Badge
                                                    variant="secondary"
                                                    key={tag}
                                                    className="rounded-sm px-1 font-normal"
                                                >
                                                    {tag}
                                                </Badge>
                                            ))
                                        )}
                                    </div>
                                </>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Filter tags..." />
                            <CommandList>
                                <CommandEmpty>No tags found.</CommandEmpty>
                                <CommandGroup>
                                    {allTags.map((tag) => {
                                        const isSelected = filterTags.includes(tag);
                                        return (
                                            <CommandItem key={tag} onSelect={() => onTagToggle(tag)}>
                                                <div
                                                    className={cn(
                                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                        isSelected
                                                            ? "bg-primary text-primary-foreground"
                                                            : "opacity-50 [&_svg]:invisible"
                                                    )}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </div>
                                                <span>{tag}</span>
                                            </CommandItem>
                                        );
                                    })}
                                </CommandGroup>
                                {filterTags.length > 0 && (
                                    <>
                                        <CommandSeparator />
                                        <CommandGroup>
                                            <CommandItem
                                                onSelect={onClearTags}
                                                className="justify-center text-center"
                                            >
                                                Clear filters
                                            </CommandItem>
                                        </CommandGroup>
                                    </>
                                )}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                {/* Reset Filters */}
                {hasActiveFilters && (
                    <Button variant="ghost" onClick={onResetFilters} className="h-8 px-2 lg:px-3">
                        Reset
                        <XIcon className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
