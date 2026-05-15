import { syncFinalAdmissions } from "./src/features/admissions/actions/admissionActions";

async function runSync() {
    console.log("Starting Academy Sync for all admitted students...");
    const res = await syncFinalAdmissions();
    console.log("Result:", res);
}

runSync().catch(console.error);
