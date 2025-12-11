import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Users, ClipboardCheck, Stethoscope, Calendar, Video, FileText, Settings } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          AI-Augmented Electronic Medical Records System
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/patients">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">Active inpatients</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/triage">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Morning Triage</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Critical patients</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/discharge-planning">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ready for Discharge</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">Patients ready today</p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Suggestions</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Pending review</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link 
              href="/triage" 
              className="block rounded-lg border p-3 hover:bg-accent transition-colors"
            >
              <div className="font-medium">View Morning Triage</div>
              <div className="text-sm text-muted-foreground">
                Review prioritized patient list with AI-generated insights
              </div>
            </Link>
            <Link 
              href="/discharge-planning" 
              className="block rounded-lg border p-3 hover:bg-accent transition-colors"
            >
              <div className="font-medium">Discharge Planning</div>
              <div className="text-sm text-muted-foreground">
                Manage discharge readiness and generate instructions
              </div>
            </Link>
            <Link 
              href="/patients" 
              className="block rounded-lg border p-3 hover:bg-accent transition-colors"
            >
              <div className="font-medium">Patient List</div>
              <div className="text-sm text-muted-foreground">
                View all active patients and their charts
              </div>
            </Link>
            <Link 
              href="/appointments" 
              className="block rounded-lg border p-3 hover:bg-accent transition-colors"
            >
              <div className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Appointments
              </div>
              <div className="text-sm text-muted-foreground">
                Manage scheduling and patient appointments
              </div>
            </Link>
            <Link 
              href="/telemedicine" 
              className="block rounded-lg border p-3 hover:bg-accent transition-colors"
            >
              <div className="font-medium flex items-center gap-2">
                <Video className="h-4 w-4" />
                Telemedicine
              </div>
              <div className="text-sm text-muted-foreground">
                Start video visits and virtual consultations
              </div>
            </Link>
            <Link 
              href="/admin/forms" 
              className="block rounded-lg border p-3 hover:bg-accent transition-colors"
            >
              <div className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Form Builder
              </div>
              <div className="text-sm text-muted-foreground">
                Create and manage clinical questionnaires
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">FHIR Server</span>
                <span className="flex items-center text-sm text-green-600">
                  <span className="mr-2 h-2 w-2 rounded-full bg-green-600"></span>
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">AI Service</span>
                <span className="flex items-center text-sm text-green-600">
                  <span className="mr-2 h-2 w-2 rounded-full bg-green-600"></span>
                  Available
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <span className="flex items-center text-sm text-green-600">
                  <span className="mr-2 h-2 w-2 rounded-full bg-green-600"></span>
                  Connected
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
