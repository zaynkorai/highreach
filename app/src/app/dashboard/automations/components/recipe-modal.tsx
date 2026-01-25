"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WORKFLOW_RECIPES } from "../lib/workflow-types";
import {
    PhoneMissed, UserPlus, CalendarCheck, FileText, Trophy, Star,
    Mail, UserX, Zap, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createWorkflow, saveWorkflow } from "../actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const iconMap: Record<string, any> = {
    PhoneMissed, UserPlus, CalendarCheck, FileText, Trophy, Star, Mail, UserX
};

function getIcon(iconName: string) {
    const Icon = iconMap[iconName] || Zap;
    return <Icon className="w-6 h-6" />;
}

interface RecipeModalProps {
    trigger: React.ReactNode;
}

export function RecipeModal({ trigger }: RecipeModalProps) {
    const [open, setOpen] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const categories = [
        { id: "all", label: "All Recipes" },
        { id: "communication", label: "Communication" },
        { id: "marketing", label: "Marketing" },
        { id: "appointments", label: "Appointments" },
        { id: "forms", label: "Forms" },
        { id: "opportunities", label: "Opportunities" },
    ];

    const [activeCategory, setActiveCategory] = useState("all");

    const filteredRecipes = WORKFLOW_RECIPES.filter(
        r => activeCategory === "all" || r.category === activeCategory
    );

    const handleCreate = async (recipeId?: string) => {
        setIsLoading(true);
        try {
            if (recipeId) {
                // Create from Recipe
                const recipe = WORKFLOW_RECIPES.find(r => r.id === recipeId);
                if (!recipe) return;

                const wf = await createWorkflow(recipe.name, recipe.description);
                if (wf) {
                    // Save initial definition from recipe
                    const definition = {
                        nodes: recipe.nodes,
                        edges: recipe.edges
                    };
                    await saveWorkflow(wf.id, definition);
                    toast.success("Workflow created from recipe");
                    router.push(`/dashboard/automations/${wf.id}`);
                }
            } else {
                // Start from Scratch
                const wf = await createWorkflow("New Workflow", "Started from scratch");
                if (wf) {
                    toast.success("New workflow created");
                    router.push(`/dashboard/automations/${wf.id}`);
                }
            }
            setOpen(false);
        } catch (error) {
            toast.error("Failed to create workflow");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Workflow Recipes</DialogTitle>
                    <DialogDescription>
                        Start with a prebuilt template and customize it to your needs.
                    </DialogDescription>
                </DialogHeader>

                {/* Category Filter */}
                <div className="flex gap-2 flex-wrap border-b border-zinc-200 dark:border-zinc-800 pb-4">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                                activeCategory === cat.id
                                    ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            )}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Recipe Grid */}
                <div className="flex-1 overflow-y-auto py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredRecipes.map(recipe => (
                            <button
                                key={recipe.id}
                                onClick={() => setSelectedRecipe(recipe.id)}
                                className={cn(
                                    "p-5 rounded-xl border-2 text-left transition-all hover:shadow-md",
                                    selectedRecipe === recipe.id
                                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                                        : "border-zinc-200 dark:border-zinc-800 hover:border-indigo-300"
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "p-3 rounded-xl",
                                        selectedRecipe === recipe.id
                                            ? "bg-indigo-500 text-white"
                                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                    )}>
                                        {getIcon(recipe.icon)}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-foreground mb-1">{recipe.name}</h3>
                                        <p className="text-sm text-muted-foreground">{recipe.description}</p>
                                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Zap className="w-3 h-3" />
                                                {recipe.nodes.filter(n => n.type === "trigger").length} trigger
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <ArrowRight className="w-3 h-3" />
                                                {recipe.nodes.filter(n => n.type === "action").length} actions
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <Button variant="outline" onClick={() => handleCreate()} disabled={isLoading}>
                        {isLoading ? "Creating..." : "Start from Scratch"}
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            disabled={!selectedRecipe || isLoading}
                            onClick={() => selectedRecipe && handleCreate(selectedRecipe)}
                        >
                            {isLoading ? "Creating..." : "Use This Recipe"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
