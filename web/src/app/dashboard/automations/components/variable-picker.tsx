"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Braces, User, MessageSquare, Calendar, CreditCard } from "lucide-react";

interface VariablePickerProps {
    onSelect: (variable: string) => void;
}

const VARIABLES = [
    {
        category: "Contact",
        icon: User,
        items: [
            { label: "First Name", value: "{{contact.first_name}}" },
            { label: "Last Name", value: "{{contact.last_name}}" },
            { label: "Full Name", value: "{{contact.name}}" },
            { label: "Email", value: "{{contact.email}}" },
            { label: "Phone", value: "{{contact.phone}}" },
        ]
    },
    {
        category: "Appointment",
        icon: Calendar,
        items: [
            { label: "Start Time", value: "{{appointment.start_time}}" },
            { label: "Date", value: "{{appointment.date}}" },
            { label: "Meeting Link", value: "{{appointment.link}}" },
        ]
    },
    {
        category: "Links",
        icon: Braces,
        items: [
            { label: "Review Link", value: "{{trigger_link.review}}" },
            { label: "Unsubscribe Link", value: "{{link.unsubscribe}}" },
        ]
    }
];

export function VariablePicker({ onSelect }: VariablePickerProps) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-brand-600">
                    <Braces className="w-3 h-3 mr-1" /> Insert Variable
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search variables..." className="h-8 text-xs" />
                    <CommandList>
                        <CommandEmpty>No variable found.</CommandEmpty>
                        {VARIABLES.map(group => (
                            <CommandGroup key={group.category} heading={group.category}>
                                {group.items.map(item => (
                                    <CommandItem
                                        key={item.value}
                                        onSelect={() => {
                                            onSelect(item.value);
                                            setOpen(false);
                                        }}
                                        className="text-xs"
                                    >
                                        <group.icon className="w-3 h-3 mr-2 opacity-70" />
                                        {item.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
