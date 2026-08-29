'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { reportsApi } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ReportCard {
  title: string
  description: string
  icon: typeof FileSpreadsheet
  type: 'excel' | 'pdf'
  action: () => Promise<Blob>
  filename: string
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

export default function DownloadsPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [asyncTaskId, setAsyncTaskId] = useState<string | null>(
    null
  )

  const { data: taskStatus } = useQuery({
    queryKey: ['task-status', asyncTaskId],
    queryFn: () => reportsApi.taskStatus(asyncTaskId!),
    enabled: !!asyncTaskId,
    refetchInterval: (query) => {
      const data = query.state.data
      if (
        data?.status === 'SUCCESS' ||
        data?.status === 'FAILURE'
      ) {
        return false
      }
      return 3000 // poll every 3s while pending
    },
  })

  const { mutate: generateAsync, isPending: isGenerating } =
    useMutation({
      mutationFn: () =>
        reportsApi.generateSpendReport({
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        }),
      onSuccess: (data) => {
        setAsyncTaskId(data.task_id)
        toast.success(
          'Report generation started. You will receive an email when ready.'
        )
      },
      onError: () => toast.error('Failed to start report generation'),
    })

  const reports: ReportCard[] = [
    {
      title: 'Spend Report (Excel)',
      description:
        '6-sheet Excel workbook with spend summary, department breakdown, monthly trends, vendor performance, overdue invoices, and payment methods.',
      icon: FileSpreadsheet,
      type: 'excel',
      action: reportsApi.downloadSpendExcel,
      filename: `spend_report_${new Date().toISOString().split('T')[0]}.xlsx`,
    },
    {
      title: 'Spend Report (PDF)',
      description:
        'Professional PDF report with spend summary, department table, monthly chart, and overdue invoices.',
      icon: FileText,
      type: 'pdf',
      action: reportsApi.downloadSpendPdf,
      filename: `spend_report_${new Date().toISOString().split('T')[0]}.pdf`,
    },
    {
      title: 'Vendor Performance (Excel)',
      description:
        'Complete vendor performance metrics including win rates, delivery rates, total invoiced amounts, and rankings.',
      icon: FileSpreadsheet,
      type: 'excel',
      action: reportsApi.downloadVendorExcel,
      filename: `vendor_performance_${new Date().toISOString().split('T')[0]}.xlsx`,
    },
  ]

  const [downloadingIndex, setDownloadingIndex] = useState<
    number | null
  >(null)

  const handleDownload = async (
    report: ReportCard,
    index: number
  ) => {
    setDownloadingIndex(index)
    try {
      const blob = await report.action()
      downloadBlob(blob, report.filename)
      toast.success(`${report.title} downloaded!`)
    } catch {
      toast.error(`Failed to download ${report.title}`)
    } finally {
      setDownloadingIndex(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Download Reports"
        description="Export procurement data as Excel or PDF"
      />

      {/* Date Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">
            Filter by Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">
                Start Date
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">
                End Date
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-44"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStartDate('')
                setEndDate('')
              }}
            >
              Clear
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Leave blank to include all data
          </p>
        </CardContent>
      </Card>

      {/* Instant Downloads */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {reports.map((report, index) => (
          <Card
            key={report.title}
            className="hover:shadow-md transition-shadow"
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 mb-4">
                <div
                  className={`p-3 rounded-xl ${
                    report.type === 'excel'
                      ? 'bg-green-50'
                      : 'bg-red-50'
                  }`}
                >
                  <report.icon
                    className={`w-6 h-6 ${
                      report.type === 'excel'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {report.title}
                  </p>
                  <Badge
                    variant="outline"
                    className="text-xs mt-1"
                  >
                    {report.type.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                {report.description}
              </p>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => handleDownload(report, index)}
                disabled={downloadingIndex === index}
              >
                {downloadingIndex === index ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Async Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Async Report Generation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            For large datasets, generate reports in the background.
            You will receive an email with a download link when the
            report is ready.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <Button
              onClick={() => generateAsync()}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Queuing...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Generate Spend Report (Email)
                </>
              )}
            </Button>

            {/* Task Status */}
            {asyncTaskId && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                {taskStatus?.status === 'SUCCESS' ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">
                      Report ready — check your email
                    </span>
                  </>
                ) : taskStatus?.status === 'FAILURE' ? (
                  <>
                    <span className="text-sm text-red-600">
                      Generation failed. Please try again.
                    </span>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-sm text-gray-600">
                      Generating report...
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {asyncTaskId && (
            <p className="text-xs text-gray-400 mt-2">
              Task ID: {asyncTaskId}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
