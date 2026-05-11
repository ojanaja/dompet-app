export default function LogPage() {
  const dummyLogs = [
    { id: '1', date: '2026-05-11 08:30:12', raw_input: "grab gojek 45k", amount: 45000, ai_type: "EXPENSE", ai_category: "ESSENTIAL", ai_score: "0.98", latency: "1.2s" },
    { id: '2', date: '2026-05-11 12:15:00', raw_input: "beli kopi starbuck 55rb buat nongkrong", amount: 55000, ai_type: "EXPENSE", ai_category: "LIFESTYLE", ai_score: "0.99", latency: "1.5s" },
    { id: '3', date: '2026-05-10 19:40:22', raw_input: "gajian proyek dompet 5000k", amount: 5000000, ai_type: "INCOME", ai_category: "INCOME", ai_score: "0.95", latency: "2.1s" },
  ];

  return (
    <div className="min-h-full bg-[#0d1117] text-[#c9d1d9] font-mono p-4 overflow-x-auto text-sm">
      <div className="mb-4 text-green-400">
        <span className="text-purple-400">ojan@dompet-server</span><span className="text-white">:</span><span className="text-blue-400">~/logs</span>$ tail -f ai-transactions.log
      </div>
      
      <table className="w-full text-left border-collapse whitespace-nowrap">
        <thead>
          <tr className="border-b border-[#30363d] text-[#8b949e]">
            <th className="p-2 font-normal">TIMESTAMP</th>
            <th className="p-2 font-normal">RAW_INPUT</th>
            <th className="p-2 font-normal">AMOUNT</th>
            <th className="p-2 font-normal">CLASSIFICATION</th>
            <th className="p-2 font-normal">AI_CONFIDENCE</th>
            <th className="p-2 font-normal">LATENCY</th>
          </tr>
        </thead>
        <tbody>
          {dummyLogs.map(log => (
            <tr key={log.id} className="border-b border-[#30363d]/50 hover:bg-[#161b22] transition-colors">
              <td className="p-2 text-blue-300">{log.date}</td>
              <td className="p-2 text-yellow-300">"{log.raw_input}"</td>
              <td className="p-2">Rp{log.amount.toLocaleString('id-ID')}</td>
              <td className="p-2">
                <span className={log.ai_type === 'EXPENSE' ? 'text-red-400' : 'text-green-400'}>[{log.ai_type}]</span>
                <span className="ml-2 text-[#8b949e]">{log.ai_category}</span>
              </td>
              <td className="p-2 text-purple-300">{log.ai_score}</td>
              <td className="p-2 text-gray-500">{log.latency}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="mt-4 text-gray-500 animate-pulse">_ waiting for new payloads...</div>
    </div>
  );
}
