import { redirect } from 'next/navigation'

// Redirect to patients page as the default view
export default function HomePage() {
  redirect('/patients')
}
