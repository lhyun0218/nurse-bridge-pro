#!/usr/bin/env node
// 간단한 검사 스크립트: /api/assignments, /api/nurses, /api/patients 호출 후 요약 출력
const BASE = process.env.BASE_URL || 'http://localhost:5173'
async function main() {
  try {
    const [aRes, nRes, pRes] = await Promise.all([
      fetch(`${BASE}/api/assignments`),
      fetch(`${BASE}/api/nurses`),
      fetch(`${BASE}/api/patients`),
    ])
    if (!aRes.ok) throw new Error(`/api/assignments failed: ${aRes.status}`)
    if (!nRes.ok) throw new Error(`/api/nurses failed: ${nRes.status}`)
    if (!pRes.ok) throw new Error(`/api/patients failed: ${pRes.status}`)

    const assigns = await aRes.json()
    const nurses = await nRes.json()
    const patients = await pRes.json()

    const perNurse = {}
    for (const pid of Object.keys(assigns)) {
      const a = assigns[pid]
      if (!a) continue
      Object.values(a).forEach(nid => {
        perNurse[nid] = (perNurse[nid] || 0) + 1
      })
    }

    const nurseList = nurses.map(n => ({ id: n.id, name: n.name }))
    console.log(`Assignments for ${Object.keys(assigns).length} patients`)
    const rows = nurseList.map(n => ({ name: n.name, count: perNurse[n.id] || 0 }))
    rows.sort((a,b)=>b.count-a.count)
    rows.forEach(r => console.log(`${r.name.padEnd(20)} ${String(r.count).padStart(3)} patients`))

    const counts = Object.values(perNurse)
    const avg = counts.reduce((s,c)=>s+c,0)/Math.max(counts.length,1)
    const max = Math.max(...counts,0)
    const min = Math.min(...counts,0)
    console.log('\nSummary:')
    console.log(`  Nurses: ${nurseList.length}`)
    console.log(`  Avg assignments per nurse: ${avg.toFixed(2)}`)
    console.log(`  Min: ${min}, Max: ${max}`)
  } catch (e) {
    console.error('Validation failed:', e)
    process.exitCode = 2
  }
}

main()
