"use client";

import { Contact } from "@/types/contact";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Search, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SortConfig } from "../hooks/use-contact-filters";

interface ContactTableProps {
    contacts: Contact[];
    selectedIds: Set<string>;
    onSelectAll: (checked: boolean) => void;
    onSelectOne: (id: string, checked: boolean) => void;
    sortConfig: SortConfig;
    onSort: (key: keyof Contact | "name") => void;
    onEditContact: (contact: Contact) => void;
    onDeleteContact: (contact: Contact) => void;
    total?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
}

export function ContactTable({
    contacts,
    selectedIds,
    onSelectAll,
    onSelectOne,
    sortConfig,
    onSort,
    onEditContact,
    onDeleteContact,
    total,
    page = 1,
    pageSize = 25,
    totalPages = 1,
    onPageChange,
}: ContactTableProps) {
    const isAllSelected = contacts.length > 0 && selectedIds.size === contacts.length;

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden flex-1">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50/50 dark:bg-white/[0.02] border-b border-zinc-200 dark:border-white/[0.08]">
                        <tr>
                            <th className="px-6 py-4 w-[50px]">
                                <Checkbox
                                    checked={isAllSelected}
                                    onCheckedChange={(checked) => onSelectAll(!!checked)}
                                    aria-label="Select all"
                                />
                            </th>
                            <th
                                className="px-6 py-4 font-semibold text-zinc-700 dark:text-zinc-200 cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                                onClick={() => onSort("name")}
                            >
                                <div className="flex items-center gap-2">
                                    Name
                                    <ArrowUpDown
                                        className={cn(
                                            "w-4 h-4 text-zinc-400",
                                            sortConfig.key === "name" && "text-brand-600"
                                        )}
                                    />
                                </div>
                            </th>
                            <th className="px-6 py-4 font-semibold text-zinc-700 dark:text-zinc-200">
                                Contact Info
                            </th>
                            <th className="px-6 py-4 font-semibold text-zinc-700 dark:text-zinc-200">
                                Tags
                            </th>
                            <th
                                className="px-6 py-4 font-semibold text-zinc-700 dark:text-zinc-200 cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                                onClick={() => onSort("source")}
                            >
                                <div className="flex items-center gap-2">
                                    Source
                                    <ArrowUpDown
                                        className={cn(
                                            "w-4 h-4 text-zinc-400",
                                            sortConfig.key === "source" && "text-brand-600"
                                        )}
                                    />
                                </div>
                            </th>
                            <th className="px-6 py-4 font-semibold text-right text-zinc-700 dark:text-zinc-200">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.08]">
                        {contacts.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="text-zinc-400 mb-4">
                                            <Search className="w-10 h-10 stroke-[1.5]" />
                                        </div>
                                        <h3 className="text-zinc-900 dark:text-white font-medium mb-1">
                                            No contacts found
                                        </h3>
                                        <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xs mx-auto">
                                            No contacts match your current filters.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            contacts.map((contact) => (
                                <tr
                                    key={contact.id}
                                    className={cn(
                                        "group hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors",
                                        selectedIds.has(contact.id) && "bg-zinc-50 dark:bg-white/[0.05]"
                                    )}
                                >
                                    <td className="px-6 py-4">
                                        <Checkbox
                                            checked={selectedIds.has(contact.id)}
                                            onCheckedChange={(checked) => onSelectOne(contact.id, !!checked)}
                                            aria-label={`Select ${contact.first_name}`}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xs font-bold border border-brand-200 dark:border-brand-500/20">
                                                {contact.first_name[0]}
                                                {contact.last_name?.[0]}
                                            </div>
                                            <span
                                                className="font-medium text-zinc-900 dark:text-white cursor-pointer hover:underline"
                                                onClick={() => onEditContact(contact)}
                                            >
                                                {contact.first_name} {contact.last_name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            {contact.email && (
                                                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                                    <span className="text-xs">✉️</span> {contact.email}
                                                </div>
                                            )}
                                            {contact.phone && (
                                                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                                    <span className="text-xs">📞</span> {contact.phone}
                                                </div>
                                            )}
                                            {!contact.email && !contact.phone && (
                                                <span className="text-zinc-400 italic text-xs">No info</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {contact.tags && contact.tags.length > 0 ? (
                                                contact.tags.map((tag) => (
                                                    <Badge
                                                        key={tag}
                                                        variant="secondary"
                                                        className="text-[10px] px-1.5 h-5"
                                                    >
                                                        {tag}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-zinc-400 text-xs">-</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 capitalize border border-zinc-200 dark:border-white/10">
                                            {contact.source || "Manual"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEditContact(contact)}
                                                className="h-8 w-8 text-zinc-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
                                                aria-label="Edit contact"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onDeleteContact(contact)}
                                                className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                                                aria-label="Delete contact"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {total !== undefined && onPageChange && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-white/[0.02]">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Showing{" "}
                        <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                            {total === 0 ? 0 : (page - 1) * pageSize + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                            {Math.min(total, page * pageSize)}
                        </span>{" "}
                        of <span className="font-semibold text-zinc-700 dark:text-zinc-200">{total}</span> contacts
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(page - 1)}
                            disabled={page <= 1}
                            className="h-8 text-xs font-medium"
                        >
                            Previous
                        </Button>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 px-2 font-medium">
                            Page {page} of {Math.max(1, totalPages)}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(page + 1)}
                            disabled={page >= totalPages}
                            className="h-8 text-xs font-medium"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
