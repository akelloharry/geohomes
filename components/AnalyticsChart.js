"use client"

export function LineChart({ data }) {
  const max = Math.max(...data.map((item) => item.value), 1)
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">Views (last 30 days)</div>
      <div className="grid gap-2 rounded-3xl border border-slate-200 bg-white p-4">
        <div className="h-48 w-full overflow-hidden">
          <div className="relative h-full w-full">
            {data.map((item, index) => {
              const height = (item.value / max) * 100
              return (
                <div
                  key={index}
                  className="absolute bottom-0 w-1.5 bg-teal"
                  style={{ left: `${index * (100 / data.length)}%`, height: `${height}%`, width: `${100 / data.length - 1}%` }}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export function BarChart({ data }) {
  const max = Math.max(...data.map((item) => item.value), 1)
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">Inquiries per property</div>
      <div className="space-y-2 rounded-3xl border border-slate-200 bg-white p-4">
        {data.map((item, index) => {
          const width = (item.value / max) * 100
          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm text-anchorGray">
                <span>{item.label}</span>
                <span>{item.value}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-teal" style={{ width: `${width}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
