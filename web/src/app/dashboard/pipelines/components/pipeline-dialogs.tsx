"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    createPipeline,
    updatePipeline,
    createStage,
    updateStage,
} from "../actions";
import { usePipelineActions } from "@/stores/pipeline-store";

interface CreatePipelineDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (pipelineId: string) => void;
}

export function CreatePipelineDialog({ isOpen, onClose, onSuccess }: CreatePipelineDialogProps) {
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { addPipeline } = usePipelineActions();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Pipeline name is required");
            return;
        }

        setIsLoading(true);
        try {
            const res = await createPipeline(name.trim());
            if (res.success) {
                toast.success("Pipeline created");
                addPipeline(res.data as any);
                if (onSuccess) onSuccess(res.data.id);
                setName("");
                onClose();
            } else {
                toast.error(res.error || "Failed to create pipeline");
            }
        } catch {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Pipeline</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="pipeline-name">Pipeline Name</Label>
                        <Input
                            id="pipeline-name"
                            placeholder="e.g. Enterprise Deals, Outbound"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || !name.trim()}>
                            {isLoading ? "Creating..." : "Create Pipeline"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

interface RenamePipelineDialogProps {
    isOpen: boolean;
    onClose: () => void;
    pipelineId: string;
    currentName: string;
}

export function RenamePipelineDialog({
    isOpen,
    onClose,
    pipelineId,
    currentName,
}: RenamePipelineDialogProps) {
    const [name, setName] = useState(currentName);
    const [isLoading, setIsLoading] = useState(false);
    const { updatePipelineName } = usePipelineActions();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            const res = await updatePipeline(pipelineId, name.trim());
            if (res.success) {
                toast.success("Pipeline renamed");
                updatePipelineName(pipelineId, name.trim());
                onClose();
            } else {
                toast.error(res.error || "Failed to rename pipeline");
            }
        } catch {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Rename Pipeline</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="rename-pipeline">Pipeline Name</Label>
                        <Input
                            id="rename-pipeline"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || !name.trim()}>
                            {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

interface CreateStageDialogProps {
    isOpen: boolean;
    onClose: () => void;
    pipelineId: string;
}

export function CreateStageDialog({ isOpen, onClose, pipelineId }: CreateStageDialogProps) {
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { addStage } = usePipelineActions();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            const res = await createStage(pipelineId, name.trim());
            if (res.success) {
                toast.success("Stage added");
                addStage(pipelineId, res.data as any);
                setName("");
                onClose();
            } else {
                toast.error(res.error || "Failed to create stage");
            }
        } catch {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Pipeline Stage</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="stage-name">Stage Name</Label>
                        <Input
                            id="stage-name"
                            placeholder="e.g. Contract Sent, Under Review"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || !name.trim()}>
                            {isLoading ? "Adding..." : "Add Stage"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

interface RenameStageDialogProps {
    isOpen: boolean;
    onClose: () => void;
    stageId: string;
    currentName: string;
}

export function RenameStageDialog({
    isOpen,
    onClose,
    stageId,
    currentName,
}: RenameStageDialogProps) {
    const [name, setName] = useState(currentName);
    const [isLoading, setIsLoading] = useState(false);
    const { updateStageName } = usePipelineActions();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            const res = await updateStage(stageId, name.trim());
            if (res.success) {
                toast.success("Stage renamed");
                updateStageName(stageId, name.trim());
                onClose();
            } else {
                toast.error(res.error || "Failed to rename stage");
            }
        } catch {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Rename Stage</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="rename-stage">Stage Name</Label>
                        <Input
                            id="rename-stage"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || !name.trim()}>
                            {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

interface ConfirmDeleteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    confirmText?: string;
    onConfirm: () => Promise<void>;
}

export function ConfirmDeleteDialog({
    isOpen,
    onClose,
    title,
    description,
    confirmText = "Delete",
    onConfirm,
}: ConfirmDeleteDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onConfirm();
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleConfirm();
                        }}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
                    >
                        {isLoading ? "Deleting..." : confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
