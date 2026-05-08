<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:dry-architecture-rules -->
# Strictly Enforce DRY (Don't Repeat Yourself)
1. DILARANG KERAS merender atau membuat fungsi, modul, script, atau komponen baru jika fungsi dengan tujuan yang sama sudah ada di dalam workspace.
2. Sebelum men-generate kode baru, agent WAJIB melakukan `grep_search` atau `file_search` untuk memastikan apakah kode untuk fungsionalitas tersebut sudah pernah dibuat sebelumnya.
3. Selalu manfaatkan (reuse) implementasi Repository, Service, atau Utility class yang telah tersedia.
<!-- END:dry-architecture-rules -->
