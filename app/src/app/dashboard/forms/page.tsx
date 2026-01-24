import { getForms } from "./actions";
import { FormsListView } from "./components/forms-list-view";

export default async function FormsPage() {
    const forms = await getForms();

    return <FormsListView initialForms={forms} />;
}
