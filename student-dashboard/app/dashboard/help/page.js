export default function HelpPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold">Help Center</h1>
            <div className="glass p-6 rounded-2xl">
                <h2 className="text-lg font-semibold mb-4">Frequently Asked Questions</h2>
                <ul className="list-disc pl-5 space-y-2 text-text-muted">
                    <li>How do I reset my password?</li>
                    <li>Where can I find the exam schedule?</li>
                    <li>Who do I contact for fee discrepancies?</li>
                </ul>
            </div>
        </div>
    );
}
