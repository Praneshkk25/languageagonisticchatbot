export default function ApprovalsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Document Approvals</h1>

            <div className="card overflow-hidden p-0">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Document Type</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>2023CS001</td>
                                <td>Medical Certificate</td>
                                <td>2026-01-21</td>
                                <td><span className="text-yellow-400">Pending</span></td>
                                <td>
                                    <button className="btn btn-primary text-xs mr-2">View</button>
                                    <button className="btn btn-success text-xs mr-2">Approve</button>
                                    <button className="btn btn-danger text-xs">Reject</button>
                                </td>
                            </tr>
                            <tr>
                                <td>2023EC045</td>
                                <td>Scholarship Form</td>
                                <td>2026-01-20</td>
                                <td><span className="text-yellow-400">Pending</span></td>
                                <td>
                                    <button className="btn btn-primary text-xs mr-2">View</button>
                                    <button className="btn btn-success text-xs mr-2">Approve</button>
                                    <button className="btn btn-danger text-xs">Reject</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
