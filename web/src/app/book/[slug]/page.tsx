import { notFound } from "next/navigation";
import { getPublicCalendar } from "../actions";
import { BookingWidget } from "./booking-widget";
import { Metadata } from "next";

type Props = {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const calendar = await getPublicCalendar(slug);
    if (!calendar) return { title: "Booking Not Found" };

    return {
        title: `Book ${calendar.name}`,
        description: calendar.description || "Schedule a meeting with us.",
    };
}

export default async function BookingPage({ params }: Props) {
    const { slug } = await params;
    const calendar = await getPublicCalendar(slug);

    if (!calendar) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
            <BookingWidget calendar={calendar} />
        </div>
    );
}
