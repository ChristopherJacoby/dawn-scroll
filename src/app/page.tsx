"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/Card";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Drawer, DrawerBody, DrawerFooter } from "@/components/ui/Drawer";
import { useReadingMode } from "@/context/reading-mode";
import { useToast } from "@/context/toast";

export default function Home() {
    const { mode, setMode } = useReadingMode();
    const toast = useToast();
    const [modalOpen, setModalOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-12 px-8 py-16">
            <div className="text-center">
                <h1 className="font-serif text-4xl text-reading-text">
                    Dawnscroll
                </h1>
                <p className="mt-2 font-sans text-reading-text-muted">
                    Read, explore, and understand the Bible
                </p>
            </div>

            {/* Reading mode toggle */}
            <div className="flex gap-3">
                {(["light", "dark", "sepia"] as const).map((m) => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className="rounded-full border border-reading-border px-4 py-1 text-sm capitalize text-reading-text transition-colors hover:bg-reading-bg-subtle aria-pressed:bg-reading-bg-subtle"
                        aria-pressed={mode === m}
                    >
                        {m}
                    </button>
                ))}
            </div>

            {/* Button variants */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-3">
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button loading>Loading</Button>
                    <Button disabled>Disabled</Button>
                </div>
            </div>

            {/* Toast demos */}
            <div className="flex gap-3">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toast.success("Changes saved successfully.")}
                >
                    Success toast
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toast.error("Something went wrong.")}
                >
                    Error toast
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toast.info("New passage available.")}
                >
                    Info toast
                </Button>
            </div>

            {/* Card variants */}
            <div className="grid w-full max-w-2xl gap-6">
                <Card>
                    <CardHeader>
                        <p className="font-sans font-medium text-reading-text">
                            Card with all slots
                        </p>
                    </CardHeader>
                    <CardBody>
                        <p className="text-sm text-reading-text-muted">
                            Body content goes here.
                        </p>
                    </CardBody>
                    <CardFooter>
                        <Button size="sm">Action</Button>
                    </CardFooter>
                </Card>

                <Card padding="md">
                    <p className="text-sm text-reading-text-muted">
                        Card with padding, no slots.
                    </p>
                </Card>

                <Card border={false} shadow="md" padding="md">
                    <p className="text-sm text-reading-text-muted">
                        No border, shadow only.
                    </p>
                </Card>
            </div>

            {/* Modal and Drawer demos */}
            <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setModalOpen(true)}>
                    Open Modal
                </Button>
                <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
                    Open Drawer
                </Button>
            </div>

            <Modal
                open={modalOpen}
                onOpenChange={setModalOpen}
                title="Confirm action"
                description="This is an optional description for the modal."
            >
                <ModalBody>
                    <p className="text-sm text-reading-text-muted">
                        Modal content goes here. Focus is trapped inside, Escape
                        closes it, and clicking the backdrop closes it too.
                    </p>
                </ModalBody>
                <ModalFooter>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setModalOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button size="sm" onClick={() => setModalOpen(false)}>
                        Confirm
                    </Button>
                </ModalFooter>
            </Modal>

            <Drawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                title="Bottom drawer"
                description="Slides up from the bottom on mobile."
            >
                <DrawerBody>
                    <p className="text-sm text-reading-text-muted">
                        Drawer content goes here. Same Radix Dialog primitives
                        as the modal, styled as a bottom sheet.
                    </p>
                </DrawerBody>
                <DrawerFooter>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDrawerOpen(false)}
                    >
                        Dismiss
                    </Button>
                </DrawerFooter>
            </Drawer>
        </div>
    );
}
